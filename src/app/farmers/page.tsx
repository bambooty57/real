import { Suspense } from 'react';
import { lazy } from 'react';

// 클라이언트 컴포넌트 동적 임포트
const FarmersClient = lazy(() => import('./FarmersClient'));

// Next.js 13 페이지 설정
export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

export default async function FarmersPage() {
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