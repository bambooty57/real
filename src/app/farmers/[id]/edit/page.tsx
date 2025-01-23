'use client';

import EditFarmerClient from './EditFarmerClient';
import { Suspense } from 'react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditFarmerPage({ params }: PageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <EditFarmerClient farmerId={params.id} />
      </Suspense>
    </div>
  );
} 