import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import Script from 'next/script'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/auth'
import { Toaster } from 'react-hot-toast'
import { SearchFilterProvider } from '@/contexts/SearchFilterContext'
import { AuthProvider } from '@/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '농기계 거래 플랫폼',
  description: '농기계 거래 플랫폼',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // const session = await getServerSession(authOptions)

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
        <AuthProvider>
          {/* <SessionProvider session={session}> */}
            <SearchFilterProvider>
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </SearchFilterProvider>
          {/* </SessionProvider> */}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}