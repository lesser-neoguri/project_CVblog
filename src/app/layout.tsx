import type { Metadata } from "next";
import "./globals.css";
import LayoutWithNav from "@/components/LayoutWithNav";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "D.blog — 개발 블로그",
  description: "기술의 깊이를 기록합니다. 개발 경험과 인사이트를 공유하는 개인 기술 블로그.",
  keywords: ["개발", "프로그래밍", "블로그", "기술", "웹개발", "프론트엔드", "백엔드"],
  authors: [{ name: "D.blog" }],
  openGraph: {
    title: "D.blog — 개발 블로그",
    description: "기술의 깊이를 기록합니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>
          <ThemeProvider>
            <LayoutWithNav>{children}</LayoutWithNav>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
