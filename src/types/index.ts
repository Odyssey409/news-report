// 뉴스 분석 관련 타입 정의

export type MediaBias = 'progressive' | 'conservative';

export interface MediaSource {
  name: string;
  bias: MediaBias;
  domain?: string;
}

export interface AnalyzedArticle {
  title: string;
  source: string;
  bias: MediaBias;
  url: string;
  publishedDate?: string;
  keywords: string[];
  mainClaim: string;
  evidence: string[];
  summary?: string;
}

export interface AnalysisResult {
  progressive: {
    articles: AnalyzedArticle[];
    commonKeywords: string[];
    overallTrend: string;
  };
  conservative: {
    articles: AnalyzedArticle[];
    commonKeywords: string[];
    overallTrend: string;
  };
  searchQuery: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface SearchParams {
  keyword: string;
  startDate: string;
  endDate: string;
}

