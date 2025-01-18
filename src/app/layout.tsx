import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '농기계 관리 시스템',
  description: '농기계 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <Script 
          src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
} 