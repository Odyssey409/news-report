"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Calendar,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Key,
  RefreshCw,
  TrendingUp,
  X,
} from "lucide-react";
import { NewsSection } from "@/components/NewsSection";
import { AnalysisResult } from "@/types";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";

type AuthMode = "none" | "admin" | "guest";

interface TrendingKeywords {
  keywords: string[];
  descriptions: Record<string, string>;
  updatedAt: string;
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");

  // 인증 관련 상태
  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [guestApiKey, setGuestApiKey] = useState("");
  const [loginError, setLoginError] = useState("");

  // 인기 키워드 관련 상태
  const [trendingKeywords, setTrendingKeywords] =
    useState<TrendingKeywords | null>(null);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // 인기 키워드 가져오기
  const fetchTrendingKeywords = useCallback(async () => {
    if (authMode === "none") return;

    setIsTrendingLoading(true);
    try {
      const response = await fetch("/api/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isAdmin: authMode === "admin",
          apiKey: authMode === "guest" ? guestApiKey : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setTrendingKeywords(data);
      }
    } catch (err) {
      console.error("Failed to fetch trending keywords:", err);
    } finally {
      setIsTrendingLoading(false);
    }
  }, [authMode, guestApiKey]);

  // 로그인 후 인기 키워드 자동 로드
  useEffect(() => {
    if (authMode !== "none") {
      fetchTrendingKeywords();
    }
  }, [authMode, fetchTrendingKeywords]);

  // 관리자 로그인 처리
  const handleAdminLogin = async () => {
    setLoginError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginId, password: loginPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setAuthMode("admin");
        setShowLoginModal(false);
        setLoginId("");
        setLoginPassword("");
      } else {
        setLoginError(data.error || "로그인에 실패했습니다.");
      }
    } catch {
      setLoginError("로그인 중 오류가 발생했습니다.");
    }
  };

  // 게스트 로그인 처리
  const handleGuestLogin = () => {
    if (!guestApiKey.trim()) {
      setLoginError("API 키를 입력해주세요.");
      return;
    }
    setAuthMode("guest");
    setShowGuestModal(false);
    setLoginError("");
  };

  // 로그아웃
  const handleLogout = () => {
    setAuthMode("none");
    setGuestApiKey("");
    setResult(null);
    setTrendingKeywords(null);
  };

  // 검색 처리
  const handleSearch = useCallback(async () => {
    if (authMode === "none") {
      setError("먼저 로그인하거나 게스트 모드로 API 키를 입력해주세요.");
      return;
    }

    if (!keyword.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStatus("🔍 AI에게 뉴스 검색을 요청하고 있습니다...");

    // 단계별 로딩 메시지 시뮬레이션
    const statusMessages = [
      { delay: 500, message: "🔍 AI에게 뉴스 검색을 요청하고 있습니다..." },
      { delay: 2000, message: "📰 진보 언론 기사를 검색하고 있습니다..." },
      { delay: 4000, message: "📰 보수 언론 기사를 검색하고 있습니다..." },
      { delay: 6000, message: "🤖 AI가 기사 내용을 분석하고 있습니다..." },
      { delay: 8000, message: "📊 관점을 비교하고 정리하고 있습니다..." },
    ];

    let currentStatusIndex = 0;
    const statusInterval = setInterval(() => {
      if (currentStatusIndex < statusMessages.length) {
        setLoadingStatus(statusMessages[currentStatusIndex].message);
        currentStatusIndex++;
      }
    }, 2000);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          startDate,
          endDate,
          isAdmin: authMode === "admin",
          apiKey: authMode === "guest" ? guestApiKey : undefined,
        }),
      });

      clearInterval(statusInterval);
      setLoadingStatus("✅ 분석 완료! 결과를 표시하고 있습니다...");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "분석 중 오류가 발생했습니다.");
      }

      setResult(data);
      setLoadingStatus("");
    } catch (err) {
      clearInterval(statusInterval);
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
      );
      setLoadingStatus("");
    } finally {
      setIsLoading(false);
    }
  }, [keyword, startDate, endDate, authMode, guestApiKey]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 인기 키워드 클릭
  const handleTrendingClick = (kw: string) => {
    setKeyword(kw);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1a1a2e]">
      {/* 연세대 블루 앰비언트 라이트 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -left-1/4 w-[600px] h-[600px] bg-[#0033A0]/8 rounded-full blur-[120px]" />
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-[#0033A0]/6 rounded-full blur-[100px]" />
        <div className="absolute -bottom-1/4 -left-1/3 w-[550px] h-[550px] bg-[#0033A0]/7 rounded-full blur-[110px]" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[600px] h-[600px] bg-[#0033A0]/8 rounded-full blur-[120px]" />
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
        {/* 상단 로그인 영역 */}
        <div className="flex justify-end items-center gap-3 mb-6">
          {authMode === "none" ? (
            <>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0033A0] text-white rounded-lg hover:bg-[#002880] transition-colors text-sm font-medium"
              >
                <LogIn className="w-4 h-4" />
                관리자 로그인
              </button>
              <button
                onClick={() => setShowGuestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#0033A0]/30 text-[#0033A0] rounded-lg hover:bg-[#0033A0]/5 transition-colors text-sm font-medium"
              >
                <Key className="w-4 h-4" />
                게스트 모드
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
                <User className="w-4 h-4" />
                {authMode === "admin" ? "관리자" : "게스트"} 로그인 중
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          )}
        </div>

        {/* 헤더 */}
        <header className="text-center mb-8">
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
            프리즘
          </h1>
          <p className="text-[#1a1a2e]/60 max-w-2xl mx-auto">
            같은 이슈, 다른 시선. 진보와 보수 언론의 보도 관점을 AI가 분석하여
            한눈에 비교해 드립니다.
          </p>
        </header>

        {/* 실시간 인기 키워드 */}
        {authMode !== "none" && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#0033A0]" />
                <span className="text-sm font-semibold text-[#0033A0]">
                  실시간 인기 키워드
                </span>
                <button
                  onClick={fetchTrendingKeywords}
                  disabled={isTrendingLoading}
                  className="p-1 rounded-full hover:bg-[#0033A0]/10 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#0033A0]/60 ${isTrendingLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {isTrendingLoading ? (
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              ) : trendingKeywords ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {trendingKeywords.keywords.map((kw, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTrendingClick(kw)}
                      className="px-3 py-1.5 bg-white border border-[#0033A0]/20 rounded-full text-sm text-[#0033A0] hover:bg-[#0033A0] hover:text-white transition-colors shadow-sm"
                      title={trendingKeywords.descriptions[kw]}
                    >
                      #{kw}
                    </button>
                  ))}
                </div>
              ) : null}

              {trendingKeywords?.updatedAt && (
                <span className="text-xs text-gray-400">
                  업데이트:{" "}
                  {format(
                    new Date(trendingKeywords.updatedAt),
                    "MM.dd HH:mm",
                    { locale: ko }
                  )}
                </span>
              )}
            </div>
          </div>
        )}

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
                  placeholder={
                    authMode === "none"
                      ? "로그인 후 검색할 수 있습니다"
                      : "검색할 키워드를 입력하세요 (예: 노란봉투법, 의대증원)"
                  }
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={authMode === "none"}
                  className="flex-1 bg-transparent px-4 py-4 text-lg text-[#1a1a2e] placeholder:text-[#1a1a2e]/40 focus:outline-none disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading || authMode === "none"}
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

          {/* 로딩 상태 표시 */}
          {isLoading && loadingStatus && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="bg-gradient-to-r from-[#0033A0]/10 to-[#0033A0]/5 border-2 border-[#0033A0]/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-[#0033A0]/20 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#0033A0] border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="absolute inset-0 w-12 h-12 rounded-full bg-[#0033A0]/10 animate-ping" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#0033A0] font-semibold text-lg mb-1">
                      {loadingStatus}
                    </p>
                    <div className="w-full bg-[#0033A0]/10 rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#0033A0] to-[#0033A0]/60 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#0033A0]/10">
                  <div className="flex items-center gap-2 text-sm text-[#0033A0]/60">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#0033A0]/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#0033A0]/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[#0033A0]/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>잠시만 기다려주세요. AI가 뉴스를 분석하고 있습니다...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 결과 영역 */}
        {(result || isLoading) && (
          <div className="flex flex-col lg:flex-row gap-6">
            <NewsSection
              bias="progressive"
              articles={result?.progressive.articles || []}
              commonKeywords={result?.progressive.commonKeywords || []}
              overallTrend={result?.progressive.overallTrend || ""}
              isLoading={isLoading}
            />

            <div className="hidden lg:flex flex-col items-center gap-4 py-10">
              <div className="flex-1 w-px bg-gradient-to-b from-[#0033A0]/30 via-[#0033A0]/50 to-[#0033A0]/30" />
              <div className="text-xs text-[#0033A0]/50 font-bold tracking-wider rotate-90 origin-center whitespace-nowrap">
                VS
              </div>
              <div className="flex-1 w-px bg-gradient-to-b from-[#0033A0]/30 via-[#0033A0]/50 to-[#0033A0]/30" />
            </div>

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
              {authMode === "none"
                ? "로그인 후 뉴스 분석을 시작할 수 있습니다"
                : "검색어를 입력하고 분석을 시작하세요"}
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

      {/* 관리자 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0033A0]">관리자 로그인</h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError("");
                }}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0033A0]"
                  placeholder="아이디 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0033A0]"
                  placeholder="비밀번호 입력"
                />
              </div>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

              <button
                onClick={handleAdminLogin}
                className="w-full py-3 bg-[#0033A0] text-white rounded-lg font-semibold hover:bg-[#002880] transition-colors"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게스트 모드 모달 */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0033A0]">게스트 모드</h2>
              <button
                onClick={() => {
                  setShowGuestModal(false);
                  setLoginError("");
                }}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Perplexity API 키를 입력하여 게스트로 서비스를 이용할 수
                있습니다.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Perplexity API 키
                </label>
                <input
                  type="password"
                  value={guestApiKey}
                  onChange={(e) => setGuestApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuestLogin()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0033A0]"
                  placeholder="pplx-xxxx..."
                />
              </div>

              <a
                href="https://www.perplexity.ai/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#0033A0] hover:underline"
              >
                API 키 발급받기 →
              </a>

              {loginError && (
                <p className="text-red-500 text-sm">{loginError}</p>
              )}

              <button
                onClick={handleGuestLogin}
                className="w-full py-3 bg-[#0033A0] text-white rounded-lg font-semibold hover:bg-[#002880] transition-colors"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      )}

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
