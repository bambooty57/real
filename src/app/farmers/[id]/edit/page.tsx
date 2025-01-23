import EditFarmerClient from './EditFarmerClient';

type Props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function EditFarmerPage({ params }: Props) {
  const farmerId = params.id;
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <EditFarmerClient farmerId={farmerId} />
    </div>
  );
} 