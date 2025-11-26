'use client';

import { useMemo } from 'react';
import { AnalyzedArticle, MediaBias } from '@/types';
import { NewsCard } from './NewsCard';
import { TrendingUp, Hash, Loader2, FileText, Lightbulb } from 'lucide-react';

interface NewsSectionProps {
  bias: MediaBias;
  articles: AnalyzedArticle[];
  commonKeywords: string[];
  overallTrend: string;
  isLoading?: boolean;
}

export function NewsSection({ 
  bias, 
  articles, 
  commonKeywords, 
  overallTrend,
  isLoading 
}: NewsSectionProps) {
  const isProgressive = bias === 'progressive';
  
  // 라이트 테마 색상
  const headerGradient = isProgressive
    ? 'from-blue-600 to-blue-700'
    : 'from-red-600 to-red-700';
  
  const bgPattern = isProgressive
    ? 'bg-gradient-to-b from-blue-50/80 to-white/90'
    : 'bg-gradient-to-b from-red-50/80 to-white/90';

  const summaryBg = isProgressive
    ? 'from-blue-100/90 via-blue-50/80 to-white/90'
    : 'from-red-100/90 via-red-50/80 to-white/90';

  const summaryBorder = isProgressive
    ? 'border-blue-300'
    : 'border-red-300';

  const accentColor = isProgressive ? 'blue' : 'red';

  // 전체 기사에서 주요 주장들 추출
  const mainClaims = useMemo(() => {
    return articles
      .filter(a => a.mainClaim)
      .map(a => a.mainClaim)
      .slice(0, 5);
  }, [articles]);

  // 전체 기사에서 공통 근거들 추출 (중복 제거, 상위 6개)
  const commonEvidence = useMemo(() => {
    const allEvidence = articles.flatMap(a => a.evidence || []);
    const uniqueEvidence = [...new Set(allEvidence)];
    return uniqueEvidence.slice(0, 6);
  }, [articles]);

  return (
    <section className={`flex-1 min-w-0 ${bgPattern} rounded-3xl p-5 border-2 ${isProgressive ? 'border-blue-200' : 'border-red-200'} shadow-lg`}>
      {/* 헤더 */}
      <header className="mb-5">
        <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${headerGradient} shadow-md`}>
          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
          <h2 className="text-xl font-bold text-white tracking-wide">
            {isProgressive ? '진보 언론' : '보수 언론'}
          </h2>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className={`w-12 h-12 text-${accentColor}-500 animate-spin mb-4`} />
          <p className="text-gray-500">기사를 분석하고 있습니다...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className={`w-16 h-16 rounded-full bg-${accentColor}-100 flex items-center justify-center mb-4`}>
            <Hash className={`w-8 h-8 text-${accentColor}-400`} />
          </div>
          <p className="text-gray-400">검색 결과가 없습니다</p>
        </div>
      ) : (
        <>
          {/* ===== 강조된 요약 카드 ===== */}
          <div className={`mb-6 p-5 rounded-2xl bg-gradient-to-br ${summaryBg} border-2 ${summaryBorder} shadow-md`}>
            {/* 전체 논조 */}
            {overallTrend && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg bg-${accentColor}-500`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-base font-bold text-${accentColor}-700`}>📰 전체 논조 요약</span>
                </div>
                <p className={`text-sm text-gray-700 leading-relaxed bg-white/80 rounded-xl p-4 border border-${accentColor}-200`}>
                  {overallTrend}
                </p>
              </div>
            )}

            {/* 핵심 주장 모음 */}
            {mainClaims.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg bg-${accentColor}-500`}>
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-base font-bold text-${accentColor}-700`}>💡 핵심 주장</span>
                </div>
                <ul className="space-y-2">
                  {mainClaims.map((claim, idx) => (
                    <li 
                      key={idx}
                      className={`text-sm text-gray-700 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-${accentColor}-400`}
                    >
                      {claim}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 공통 근거 모음 */}
            {commonEvidence.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg bg-${accentColor}-500`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-base font-bold text-${accentColor}-700`}>📋 주요 근거</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {commonEvidence.map((evidence, idx) => (
                    <div 
                      key={idx}
                      className={`text-xs text-gray-700 leading-relaxed p-3 rounded-lg bg-white/70 border border-${accentColor}-200`}
                    >
                      <span className={`inline-block w-5 h-5 text-center rounded-full bg-${accentColor}-500 text-white text-xs font-bold mr-2 leading-5`}>
                        {idx + 1}
                      </span>
                      {evidence}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 공통 키워드 */}
            {commonKeywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-1.5 rounded-lg bg-${accentColor}-500`}>
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-base font-bold text-${accentColor}-700`}># 공통 키워드</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {commonKeywords.map((keyword, idx) => (
                    <span 
                      key={idx}
                      className={`px-3 py-1.5 text-sm rounded-full bg-${accentColor}-100 text-${accentColor}-700 border border-${accentColor}-300 font-medium`}
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 기사 목록 헤더 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-gray-600">📄 개별 기사 분석</span>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${accentColor}-100 text-${accentColor}-600 font-medium`}>
              {articles.length}건
            </span>
          </div>

          {/* 기사 목록 */}
          <div className="space-y-4">
            {articles.map((article, index) => (
              <NewsCard key={index} article={article} index={index} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

