import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Perplexity API 클라이언트 생성 함수
function createPerplexityClient(apiKey: string) {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.perplexity.ai",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, isAdmin } = await request.json();

    // API 키 결정
    let perplexityApiKey: string;

    if (isAdmin) {
      if (!process.env.PERPLEXITY_API_KEY) {
        return NextResponse.json(
          { error: "서버에 API 키가 설정되지 않았습니다." },
          { status: 500 }
        );
      }
      perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    } else {
      if (!apiKey) {
        return NextResponse.json(
          { error: "API 키를 입력해주세요." },
          { status: 400 }
        );
      }
      perplexityApiKey = apiKey;
    }

    const perplexity = createPerplexityClient(perplexityApiKey);

    const response = await perplexity.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `당신은 한국 뉴스 트렌드 분석가입니다. 현재 한국에서 가장 많이 보도되고 있는 뉴스 키워드를 찾아주세요.
응답은 반드시 JSON 형식만 사용하세요. 다른 텍스트 없이 JSON만 출력하세요.

응답 형식:
{
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "descriptions": {
    "키워드1": "간단한 설명 (10자 이내)",
    "키워드2": "간단한 설명",
    ...
  }
}`,
        },
        {
          role: "user",
          content: `오늘 한국 뉴스에서 가장 많이 다뤄지고 있는 주요 이슈 키워드 5개를 찾아주세요.
정치, 경제, 사회, 국제 등 다양한 분야에서 현재 가장 화제가 되는 키워드를 선정해주세요.
JSON 형식으로만 응답하세요.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";

    // JSON 파싱
    let result;
    try {
      let jsonStr = content;

      // JSON 블록 추출
      const jsonBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1];
      } else {
        const codeBlockMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = content.indexOf("{");
          const lastBrace = content.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = content.substring(firstBrace, lastBrace + 1);
          }
        }
      }

      result = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Trending keywords parsing failed:", content);
      result = {
        keywords: ["의대증원", "금리인하", "부동산", "AI", "총선"],
        descriptions: {
          의대증원: "의료계 이슈",
          금리인하: "경제 정책",
          부동산: "주택 시장",
          AI: "인공지능",
          총선: "정치 이슈",
        },
      };
    }

    return NextResponse.json({
      ...result,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: "인기 키워드를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
