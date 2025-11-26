import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "온저 3조 뉴스관점 비교 AI",
  description:
    "같은 이슈를 진보와 보수 언론이 어떻게 다르게 보도하는지 AI가 분석하여 비교해 드립니다.",
  keywords: [
    "뉴스 분석",
    "언론 비교",
    "진보 언론",
    "보수 언론",
    "AI 뉴스 분석",
  ],
  icons: {
    icon: "/images/squareLogo.png",
    shortcut: "/images/squareLogo.png",
    apple: "/images/squareLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKr.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
