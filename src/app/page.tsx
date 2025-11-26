"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Search, Calendar, Sparkles } from "lucide-react";
import { NewsSection } from "@/components/NewsSection";
import { AnalysisResult } from "@/types";
import { format, subDays } from "date-fns";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석 중 오류가 발생했습니다.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, [keyword, startDate, endDate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1a1a2e]">
      {/* 연세대 블루 앰비언트 라이트 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 상단 좌측 앰비언트 */}
        <div className="absolute -top-1/3 -left-1/4 w-[600px] h-[600px] bg-[#0033A0]/8 rounded-full blur-[120px]" />
        {/* 상단 우측 앰비언트 */}
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-[#0033A0]/6 rounded-full blur-[100px]" />
        {/* 하단 좌측 앰비언트 */}
        <div className="absolute -bottom-1/4 -left-1/3 w-[550px] h-[550px] bg-[#0033A0]/7 rounded-full blur-[110px]" />
        {/* 하단 우측 앰비언트 */}
        <div className="absolute -bottom-1/3 -right-1/4 w-[600px] h-[600px] bg-[#0033A0]/8 rounded-full blur-[120px]" />
        {/* 중앙 미세 앰비언트 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#0033A0]/3 rounded-full blur-[150px]" />
      </div>

      {/* 테두리 앰비언트 라이트 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#0033A0]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#0033A0]/40 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-[#0033A0]/40 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-[#0033A0]/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-3 py-8">
        {/* 헤더 */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-4">
            <Image
              src="/images/horizonLogo.png"
              alt="로고"
              width={280}
              height={70}
              className="h-16 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#0033A0] mb-3">
            온저 3조 뉴스관점 비교 AI
          </h1>
          <p className="text-[#1a1a2e]/60 max-w-2xl mx-auto">
            같은 이슈, 다른 시선. 진보와 보수 언론의 보도 관점을 AI가 분석하여
            한눈에 비교해 드립니다.
          </p>
        </header>

        {/* 검색 영역 */}
        <div className="mb-10">
          <div className="flex flex-col lg:flex-row items-center gap-4 justify-center">
            {/* 검색바 */}
            <div className="relative flex-1 max-w-2xl w-full">
              <div className="absolute inset-0 bg-[#0033A0]/10 rounded-2xl blur-xl" />
              <div className="relative flex items-center bg-white/80 backdrop-blur-xl border-2 border-[#0033A0]/20 rounded-2xl overflow-hidden shadow-lg shadow-[#0033A0]/5">
                <div className="pl-5">
                  <Search className="w-5 h-5 text-[#0033A0]/50" />
                </div>
                <input
                  type="text"
                  placeholder="검색할 키워드를 입력하세요 (예: 노란봉투법, 의대증원)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent px-4 py-4 text-lg text-[#1a1a2e] placeholder:text-[#1a1a2e]/40 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="m-2 px-6 py-2.5 bg-[#0033A0] hover:bg-[#002880] rounded-xl font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      분석 중
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      분석하기
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 날짜 선택 */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border-2 border-[#0033A0]/20 rounded-2xl p-3 shadow-lg shadow-[#0033A0]/5">
              <Calendar className="w-5 h-5 text-[#0033A0]/50" />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#0033A0]/20 rounded-lg px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:border-[#0033A0]/50"
                />
                <span className="text-[#1a1a2e]/30">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#FAF8F5] border border-[#0033A0]/20 rounded-lg px-3 py-2 text-sm text-[#1a1a2e] focus:outline-none focus:border-[#0033A0]/50"
                />
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 text-center">
              <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 inline-block">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* 결과 영역 */}
        {(result || isLoading) && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 진보 섹션 (좌측) */}
            <NewsSection
              bias="progressive"
              articles={result?.progressive.articles || []}
              commonKeywords={result?.progressive.commonKeywords || []}
              overallTrend={result?.progressive.overallTrend || ""}
              isLoading={isLoading}
            />

            {/* 중앙 구분선 */}
            <div className="hidden lg:flex flex-col items-center gap-4 py-10">
              <div className="flex-1 w-px bg-gradient-to-b from-[#0033A0]/30 via-[#0033A0]/50 to-[#0033A0]/30" />
              <div className="text-xs text-[#0033A0]/50 font-bold tracking-wider rotate-90 origin-center whitespace-nowrap">
                VS
              </div>
              <div className="flex-1 w-px bg-gradient-to-b from-[#0033A0]/30 via-[#0033A0]/50 to-[#0033A0]/30" />
            </div>

            {/* 보수 섹션 (우측) */}
            <NewsSection
              bias="conservative"
              articles={result?.conservative.articles || []}
              commonKeywords={result?.conservative.commonKeywords || []}
              overallTrend={result?.conservative.overallTrend || ""}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* 초기 상태 */}
        {!result && !isLoading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#0033A0]/10 mb-6">
              <Search className="w-10 h-10 text-[#0033A0]/40" />
            </div>
            <p className="text-[#1a1a2e]/60 text-lg mb-2">
              검색어를 입력하고 분석을 시작하세요
            </p>
            <p className="text-[#1a1a2e]/40 text-sm">
              AI가 진보와 보수 언론의 보도 관점을 분석하여 비교해 드립니다
            </p>
          </div>
        )}

        {/* 푸터 */}
        <footer className="mt-16 text-center text-[#0033A0]/40 text-xs">
          <p>by 정은영</p>
        </footer>
      </div>

      {/* 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
