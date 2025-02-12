import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const FarmersClient = dynamic(() => import('./FarmersClient'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
});

export const dynamic = 'force-static';
export const revalidate = 3600; // 1시간마다 재검증

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