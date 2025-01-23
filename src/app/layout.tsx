import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '농민 관리 시스템',
  description: '농민 정보 관리 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_API_KEY}&libraries=services`}
          strategy="beforeInteractive"
        />
        <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" async />
      </head>
      <body className={`${inter.className} bg-white`}>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}