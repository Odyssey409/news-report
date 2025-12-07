import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalyzedArticle, AnalysisResult, MediaBias } from "@/types";
import {
  PROGRESSIVE_MEDIA,
  CONSERVATIVE_MEDIA,
  getMediaNamesByBias,
} from "@/config/mediaSources";

// Perplexity API 클라이언트 생성 함수
function createPerplexityClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });
}

interface SearchResult {
  articles: AnalyzedArticle[];
  commonKeywords: string[];
  overallTrend: string;
}

// 필드 정규화
function normalizeArticle(
  article: Partial<AnalyzedArticle>,
  bias: MediaBias
): AnalyzedArticle {
  const clean = (arr?: string[]) =>
    (arr || []).filter((v) => v?.trim()).map((v) => v.trim());

  return {
    title: article.title?.trim() || "제목 미상",
    source: article.source?.trim() || "출처 미상",
    url: article.url?.trim() || "",
    bias,
    publishedDate: article.publishedDate?.trim() || "",
    keywords: clean(article.keywords).slice(0, 5) || ["키워드 없음"],
    mainClaim:
      article.mainClaim?.trim() || article.summary?.trim() || "내용 확인 필요",
    evidence: clean(article.evidence).slice(0, 3) || ["근거 확인 필요"],
    summary: article.summary?.trim() || article.title?.trim() || "요약 없음",
  };
}

// 텍스트에서 기사 정보 추출 (파싱 실패 대비)
function extractArticlesFromText(
  text: string,
  bias: MediaBias,
  limit = 4
): AnalyzedArticle[] {
  const articles: AnalyzedArticle[] = [];

  // title, source, url, keywords, mainClaim, evidence, summary 모두 추출 시도
  const articleRegex =
    /"title"\s*:\s*"([^"]+)"[\s\S]*?"source"\s*:\s*"([^"]+)"[\s\S]*?"url"\s*:\s*"([^"]+)"/g;

  let match: RegExpExecArray | null;
  while ((match = articleRegex.exec(text)) && articles.length < limit) {
    const [fullMatch, title, source, url] = match;
    const articleStart = match.index;
    const articleEnd = text.indexOf("}", articleStart + fullMatch.length);
    const articleText = text.substring(articleStart, articleEnd);

    // 추가 필드 추출
    const extractField = (fieldName: string, defaultValue: string = "") => {
      const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, "s");
      const m = articleText.match(regex);
      return m?.[1]?.trim() || defaultValue;
    };

    const extractArray = (fieldName: string): string[] => {
      const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*)\\]`, "s");
      const m = articleText.match(regex);
      if (!m) return [];
      return m[1]
        .split(",")
        .map((v) => v.replace(/"/g, "").trim())
        .filter(Boolean);
    };

    articles.push(
      normalizeArticle(
        {
          title,
          source,
          url,
          publishedDate: extractField("publishedDate"),
          keywords: extractArray("keywords"),
          mainClaim: extractField("mainClaim"),
          evidence: extractArray("evidence"),
          summary: extractField("summary"),
        },
        bias
      )
    );
  }

  return articles;
}

async function searchAndAnalyzeNews(
  perplexity: OpenAI,
  keyword: string,
  bias: MediaBias,
  startDate: string,
  endDate: string
): Promise<SearchResult> {
  const mediaNames = getMediaNamesByBias(bias);
  const biasLabel = bias === "progressive" ? "진보" : "보수";

  const systemPrompt = `한국 뉴스 검색 전문가. 실제 기사만 찾아서 간결한 JSON으로 응답.

규칙:
1. 실제 존재하는 기사만
2. JSON만 출력 (설명 금지)
3. 모든 텍스트 최대한 짧게
4. 완전한 JSON 필수

형식:
{
  "articles": [
    {
      "title": "제목",
      "source": "언론사",
      "url": "https://...",
      "publishedDate": "YYYY-MM-DD",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "mainClaim": "핵심 주장 1문장",
      "evidence": ["근거1", "근거2"],
      "summary": "요약 2문장"
    }
  ],
  "commonKeywords": ["공통키워드1", "공통키워드2", "공통키워드3"],
  "overallTrend": "전반적 논조 2문장"
}

중요:
- 기사 3-4개만
- 모든 필드 짧게
- JSON 완성 필수`;

  const userPrompt = `"${keyword}" 검색. ${startDate}~${endDate}. ${biasLabel} 언론: ${mediaNames.join(
    ", "
  )}. JSON만 출력. 짧게.`;

  try {
    console.log(`\n=== ${biasLabel} 언론 검색 시작 ===`);

    const response = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 8000, // 간결한 응답으로 충분
      // Perplexity 특정 옵션들
      // @ts-expect-error - Perplexity 전용 파라미터
      search_domain_filter: mediaNames.flatMap((name) => {
        const media = [...PROGRESSIVE_MEDIA, ...CONSERVATIVE_MEDIA].find(
          (m) => m.name === name
        );
        return media?.domain ? [media.domain] : [];
      }),
      search_recency_filter: "month",
      return_citations: false,
      return_related_questions: false,
    });

    const content = response.choices[0]?.message?.content || "";

    console.log(`📄 응답 길이: ${content.length}자`);
    if (content.length > 1000) {
      console.log(`첫 500자: ${content.substring(0, 500)}...`);
    } else {
      console.log(`전체 응답: ${content}`);
    }

    // JSON 파싱 - 간단하고 안정적으로
    let result: SearchResult;
    try {
      // 1. JSON 추출
      let jsonStr = content.trim();

      // ```json ... ``` 또는 ``` ... ``` 블록 제거
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }

      // 첫 { 부터 마지막 } 까지만 추출
      const firstBrace = jsonStr.indexOf("{");
      const lastBrace = jsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
      }

      // 2. 파싱 시도
      try {
        result = JSON.parse(jsonStr);
        console.log(
          `✅ JSON 파싱 성공: ${result.articles?.length || 0}개 기사`
        );
      } catch (parseErr) {
        console.log("⚠️ JSON 파싱 실패, 개별 기사 추출 시도...");

        // 개별 기사 추출
        const articles = extractArticlesFromText(content, bias, 4);

        if (articles.length > 0) {
          result = {
            articles: articles.map((article) =>
              normalizeArticle(article, bias)
            ),
            commonKeywords: ["키워드 확인 필요"],
            overallTrend: `${biasLabel} 언론 "${keyword}" 관련 기사`,
          };
          console.log(`✅ 개별 추출 성공: ${articles.length}개`);
        } else {
          // 빈 결과
          result = {
            articles: [],
            commonKeywords: [],
            overallTrend: "",
          };
          console.log(`❌ 기사 추출 실패`);
        }
      }

      console.log(`최종 결과: ${result.articles?.length || 0}개 기사`);

      // 정규화
      if (!result.articles) result.articles = [];
      result.articles = result.articles.map((article) =>
        normalizeArticle(article, bias)
      );

      if (!result.commonKeywords || result.commonKeywords.length === 0) {
        result.commonKeywords = ["키워드 확인 필요"];
      }

      if (!result.overallTrend) {
        result.overallTrend = `${biasLabel} 언론 "${keyword}" 관련 보도`;
      }

      console.log(
        `✅ ${biasLabel} 검색 완료: ${result.articles.length}개 기사`
      );
      return result;
    } catch (outerError) {
      // 전체 파싱 프로세스 실패
      console.error(`❌ ${biasLabel} 파싱 실패:`, outerError);

      result = {
        articles: [],
        commonKeywords: [],
        overallTrend: "",
      };
      return result;
    }
  } catch (error) {
    console.error(`❌ ${biasLabel} 언론 API 호출 실패:`, error);

    return {
      articles: [],
      commonKeywords: [],
      overallTrend: `${biasLabel} 언론 검색 중 오류 발생`,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, startDate, endDate, apiKey, isAdmin } =
      await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "검색 키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    // API 키 결정: 관리자면 서버 키 사용, 아니면 클라이언트가 제공한 키 사용
    let perplexityApiKey: string;

    if (isAdmin) {
      // 관리자 검증
      if (!process.env.PERPLEXITY_API_KEY) {
        return NextResponse.json(
          { error: "서버에 Perplexity API 키가 설정되지 않았습니다." },
          { status: 500 }
        );
      }
      perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    } else {
      // 게스트 모드: 클라이언트가 제공한 API 키 사용
      if (!apiKey) {
        return NextResponse.json(
          { error: "API 키를 입력해주세요." },
          { status: 400 }
        );
      }
      perplexityApiKey = apiKey;
    }

    // Perplexity 클라이언트 생성
    const perplexity = createPerplexityClient(perplexityApiKey);

    // 진보/보수 병렬 검색 (속도 향상) - 하나가 실패해도 다른 하나는 계속 진행
    console.log("=== 진보/보수 언론 병렬 검색 시작 ===");

    const [progressivePromise, conservativePromise] = [
      searchAndAnalyzeNews(
        perplexity,
        keyword,
        "progressive",
        startDate,
        endDate
      ).catch((error) => {
        console.error("진보 언론 검색 실패:", error);
        return {
          articles: [],
          commonKeywords: [],
          overallTrend: `진보 언론 검색 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`,
        } as SearchResult;
      }),
      searchAndAnalyzeNews(
        perplexity,
        keyword,
        "conservative",
        startDate,
        endDate
      ).catch((error) => {
        console.error("보수 언론 검색 실패:", error);
        return {
          articles: [],
          commonKeywords: [],
          overallTrend: `보수 언론 검색 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`,
        } as SearchResult;
      }),
    ];

    // 병렬 실행
    const [progressiveResult, conservativeResult] = await Promise.all([
      progressivePromise,
      conservativePromise,
    ]);

    console.log(
      `✅ 검색 완료 - 진보: ${progressiveResult.articles.length}개, 보수: ${conservativeResult.articles.length}개`
    );

    // 둘 다 실패한 경우에만 에러 반환
    if (
      progressiveResult.articles.length === 0 &&
      conservativeResult.articles.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "진보와 보수 언론 모두에서 기사를 찾을 수 없었습니다. 키워드나 날짜 범위를 변경해보세요.",
        },
        { status: 404 }
      );
    }

    const result: AnalysisResult = {
      progressive: progressiveResult,
      conservative: conservativeResult,
      searchQuery: keyword,
      dateRange: { start: startDate, end: endDate },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);

    // API 키 오류 체크
    const errorMessage = error instanceof Error ? error.message : "";
    if (
      errorMessage.includes("401") ||
      errorMessage.includes("unauthorized") ||
      errorMessage.includes("invalid")
    ) {
      return NextResponse.json(
        {
          error:
            "API 키가 유효하지 않습니다. 올바른 Perplexity API 키를 입력해주세요.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "뉴스 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
