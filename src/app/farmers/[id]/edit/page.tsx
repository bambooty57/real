import { use } from 'react';
import EditFarmerClient from './EditFarmerClient';

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditFarmerPage({ params }: Props) {
  const { id: farmerId } = use(params);
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <EditFarmerClient farmerId={farmerId} />
    </div>
  );
} 