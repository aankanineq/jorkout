import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'JO Dashboard',
  description: '러닝 · 웨이트 기록 대시보드',
}

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        {/* 데스크탑: 상단 nav 높이만큼 패딩, 모바일: 하단 nav 높이만큼 패딩 */}
        <main className="md:pt-12 pb-14 md:pb-0 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
