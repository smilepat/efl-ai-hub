import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EFL Mini AI Hub — 영어교사용 AI 플랫폼',
  description:
    '지문 분석, 문항 생성, 학생 진단, 맞춤 추천까지 — 영어교사를 위한 AI 교무실',
  keywords: ['EFL', 'AI', '영어교육', '문항생성', '학습진단', 'TESOL'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="animated-bg min-h-screen">{children}</body>
    </html>
  );
}

