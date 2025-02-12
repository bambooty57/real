import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// 클라이언트 컴포넌트 동적 임포트
const FarmersClient = dynamic(() => import('./FarmersClient'), {
  loading: () => null,
  ssr: false
});

// Next.js 13 페이지 설정
export const metadata = {
  dynamic: 'force-dynamic',
  fetchCache: 'force-no-store'
};

export default function FarmersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }>
        <FarmersClient />
      </Suspense>
    </div>
  );
}