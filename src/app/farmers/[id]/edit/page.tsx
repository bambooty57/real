import { use } from 'react';
import EditFarmerClient from './EditFarmerClient';

export default function EditFarmerPage({ params }: { params: { id: string } }) {
  const farmerId = use(params).id;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <EditFarmerClient farmerId={farmerId} />
    </div>
  );
} 