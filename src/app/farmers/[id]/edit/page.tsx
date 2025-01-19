import { use } from 'react';
import NewFarmer from '../../new/page';

export default function EditFarmerPage({ params }: { params: { id: string } }) {
  const farmerId = use(params).id;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <NewFarmer mode="edit" farmerId={farmerId} />
    </div>
  );
} 