import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalyzedArticle, AnalysisResult, MediaBias } from "@/types";
import {
  PROGRESSIVE_MEDIA,
  CONSERVATIVE_MEDIA,
  getMediaNamesByBias,
} from "@/config/mediaSources";

// Perplexity API 클라이언트 설정
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || "",
  baseURL: "https://api.perplexity.ai",
});

interface SearchResult {
  articles: AnalyzedArticle[];
  commonKeywords: string[];
  overallTrend: string;
}

async function searchAndAnalyzeNews(
  keyword: string,
  bias: MediaBias,
  startDate: string,
  endDate: string
): Promise<SearchResult> {
  const mediaNames = getMediaNamesByBias(bias);
  const biasLabel = bias === "progressive" ? "진보" : "보수";

  const systemPrompt = `당신은 한국 뉴스 검색 및 분석 전문가입니다. 웹에서 실제 뉴스 기사를 검색하여 분석 결과를 JSON 형식으로 제공합니다.

**절대적인 규칙**: 
1. 반드시 실제 존재하는 뉴스 기사만 검색하여 응답하세요
2. 응답은 오직 JSON 형식만 허용됩니다. 다른 설명이나 텍스트 없이 JSON만 출력하세요
3. 검색 결과가 없으면 빈 배열로 응답하세요

**JSON 응답 형식** (이 형식을 정확히 따르세요):
{
  "articles": [
    {
      "title": "실제 기사 제목",
      "source": "언론사명",
      "url": "https://실제기사URL",
      "publishedDate": "YYYY-MM-DD",
      "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
      "mainClaim": "이 기사의 핵심 주장 (1-2문장)",
      "evidence": ["기사에서 언급된 구체적 근거1", "구체적 근거2", "구체적 근거3"],
      "summary": "기사 전체 내용 요약 (3-4문장으로 상세하게)"
    }
  ],
  "commonKeywords": ["전체 기사들의 공통 키워드 5-10개"],
  "overallTrend": "이 언론사들의 전반적인 보도 논조와 관점을 상세히 분석 (3-5문장)"
}

**필수 준수사항**:
- 최소 3개, 최대 15개의 기사를 검색하세요
- 각 기사의 keywords는 5개 이상 추출
- evidence는 3개 이상의 구체적 근거 제시
- summary는 기사 내용을 상세히 요약
- overallTrend는 해당 성향 언론의 전체적인 보도 관점을 깊이 있게 분석
- JSON 외의 텍스트(설명, 주석 등)는 절대 포함하지 마세요`;

  const userPrompt = `한국 뉴스를 검색하고 JSON으로만 응답하세요.

**검색 조건**:
- 키워드: "${keyword}"
- 기간: ${startDate} ~ ${endDate}
- 언론사 (${biasLabel} 성향): ${mediaNames.join(", ")}

**요청사항**:
위 ${biasLabel} 언론사들에서 "${keyword}" 관련 기사를 검색하여 각 기사별로:
1. 제목, URL, 발행일
2. 핵심 키워드 5개 이상
3. 기사의 핵심 주장과 관점
4. 주장을 뒷받침하는 구체적 근거 3개 이상
5. 기사 내용 상세 요약

**출력**: 최소 5개 ~ 최대 15개 기사를 JSON 형식으로만 응답. 설명 없이 JSON만 출력하세요.`;

  try {
    const response = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 10000,
      // Perplexity 특정 옵션들
      // @ts-expect-error - Perplexity 전용 파라미터
      search_domain_filter: mediaNames.flatMap((name) => {
        const media = [...PROGRESSIVE_MEDIA, ...CONSERVATIVE_MEDIA].find(
          (m) => m.name === name
        );
        return media?.domain ? [media.domain] : [];
      }),
      search_recency_filter: "month",
      return_citations: true,
      return_related_questions: false,
    });

    const content = response.choices[0]?.message?.content || "";

    // 디버그: 실제 응답 출력
    console.log(`\n=== ${biasLabel} 언론 API 응답 ===`);
    console.log(content.substring(0, 2000));
    console.log("=== 응답 끝 ===\n");

    // JSON 파싱 시도
    let result: SearchResult;
    try {
      // JSON 블록 추출 시도 (여러 패턴 지원)
      let jsonStr = content;

      // 1. ```json ... ``` 블록 추출
      const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1];
      } else {
        // 2. ``` ... ``` 블록 추출 (언어 표시 없는 경우)
        const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          // 3. 첫 번째 { 부터 마지막 } 까지 추출
          const firstBrace = content.indexOf("{");
          const lastBrace = content.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = content.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      // JSON 문자열 정리
      jsonStr = jsonStr.trim();

      console.log(
        `파싱할 JSON 문자열 (처음 500자): ${jsonStr.substring(0, 500)}`
      );

      result = JSON.parse(jsonStr);

      // articles 배열이 없으면 빈 배열로 초기화
      if (!result.articles) {
        result.articles = [];
      }

      // bias 필드 추가
      result.articles = result.articles.map((article) => ({
        ...article,
        bias,
        // 필수 필드 기본값 설정
        keywords: article.keywords || [],
        evidence: article.evidence || [],
        mainClaim: article.mainClaim || article.summary || "",
      }));

      // 기본값 설정
      result.commonKeywords = result.commonKeywords || [];
      result.overallTrend = result.overallTrend || "";
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 응답 생성
      console.error("JSON parsing failed:", parseError);
      console.error("원본 응답:", content.substring(0, 1000));
      result = {
        articles: [],
        commonKeywords: [],
        overallTrend: `${biasLabel} 언론사의 "${keyword}" 관련 기사를 분석 중 오류가 발생했습니다.`,
      };
    }

    return result;
  } catch (error) {
    console.error(`Error searching ${bias} news:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, startDate, endDate } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: "검색 키워드를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        { error: "Perplexity API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 진보/보수 동시 검색
    const [progressiveResult, conservativeResult] = await Promise.all([
      searchAndAnalyzeNews(keyword, "progressive", startDate, endDate),
      searchAndAnalyzeNews(keyword, "conservative", startDate, endDate),
    ]);

    const result: AnalysisResult = {
      progressive: progressiveResult,
      conservative: conservativeResult,
      searchQuery: keyword,
      dateRange: { start: startDate, end: endDate },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "뉴스 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
