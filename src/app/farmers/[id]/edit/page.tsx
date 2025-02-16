'use client';

import NewFarmer from '../../new/NewFarmer';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditFarmerPage({ params }: PageProps) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <NewFarmer 
        mode="edit"
        farmerId={params.id}
      />
    </div>
  );
} 