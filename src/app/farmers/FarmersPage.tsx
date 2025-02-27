'use client';

import dynamic from 'next/dynamic';

const FarmersClient = dynamic(() => import('./FarmersClient'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  )
});

export default function FarmersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FarmersClient />
    </div>
  );
} 