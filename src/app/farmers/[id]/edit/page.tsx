'use client';

import EditFarmerClient from './EditFarmerClient';
import { Suspense } from 'react';
import { use } from 'react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditFarmerPage({ params }: PageProps) {
  const { id } = use(params);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <EditFarmerClient farmerId={id} />
      </Suspense>
    </div>
  );
} 