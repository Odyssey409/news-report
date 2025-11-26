'use client';

import { AnalyzedArticle } from '@/types';
import { ExternalLink, Tag, MessageSquare, FileText } from 'lucide-react';

interface NewsCardProps {
  article: AnalyzedArticle;
  index: number;
}

export function NewsCard({ article, index }: NewsCardProps) {
  const isProgressive = article.bias === 'progressive';
  
  const biasColor = isProgressive 
    ? 'from-blue-50 to-white border-blue-200' 
    : 'from-red-50 to-white border-red-200';
  
  const tagColor = isProgressive
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-red-100 text-red-700 border-red-200';

  const accentColor = isProgressive ? 'blue' : 'red';

  return (
    <article 
      className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-br ${biasColor} p-5 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg`}
      style={{ 
        animationDelay: `${index * 100}ms`,
        animation: 'fadeSlideUp 0.5s ease-out forwards',
        opacity: 0,
        transform: 'translateY(20px)'
      }}
    >
      {/* 헤더 */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-lg text-gray-800 leading-tight line-clamp-2">
            {article.title}
          </h3>
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex-shrink-0 p-2 rounded-lg bg-${accentColor}-100 hover:bg-${accentColor}-200 transition-colors`}
            title="기사 원문 보기"
          >
            <ExternalLink className={`w-4 h-4 text-${accentColor}-600`} />
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium">{article.source}</span>
          {article.publishedDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{article.publishedDate}</span>
            </>
          )}
        </div>
      </div>

      {/* 키워드 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">키워드</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {article.keywords.map((keyword, idx) => (
            <span 
              key={idx}
              className={`px-2.5 py-1 text-xs rounded-full border ${tagColor}`}
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>

      {/* 핵심 주장 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">핵심 주장</span>
        </div>
        <p className={`text-gray-700 text-sm leading-relaxed bg-white/80 rounded-lg p-3 border border-${accentColor}-100`}>
          {article.mainClaim}
        </p>
      </div>

      {/* 근거 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">근거</span>
        </div>
        <ul className="space-y-2">
          {article.evidence.map((ev, idx) => (
            <li 
              key={idx}
              className={`text-sm text-gray-600 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-${accentColor}-400`}
            >
              {ev}
            </li>
          ))}
        </ul>
      </div>

      {/* 요약 (있을 경우) */}
      {article.summary && (
        <div className={`mt-4 pt-4 border-t border-${accentColor}-100`}>
          <p className="text-xs text-gray-500 italic">
            {article.summary}
          </p>
        </div>
      )}
    </article>
  );
}

