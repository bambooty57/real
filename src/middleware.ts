import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 쿠키에서 Firebase 인증 토큰 확인
  const token = request.cookies.get('firebase-token');

  // API 경로나 정적 파일은 체크하지 않음
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // 토큰이 없는 경우에도 페이지 접근은 허용 (모달로 처리)
  const response = NextResponse.next();

  // Firebase 연결 유지를 위한 헤더 추가
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  response.headers.set('Connection', 'keep-alive');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 