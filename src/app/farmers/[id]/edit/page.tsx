'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FormData } from '@/types/farmer';
import EditFarmerClient from './EditFarmerClient';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface PageProps {
  params: {
    id: string;
  };
}

interface MainCrop {
  rice: boolean;
  barley: boolean;
  hanwoo: boolean;
  soybean: boolean;
  sweetPotato: boolean;
  persimmon: boolean;
  pear: boolean;
  plum: boolean;
  sorghum: boolean;
  goat: boolean;
  other: boolean;
}

interface FarmingTypes {
  paddyFarming: boolean;
  fieldFarming: boolean;
  orchard: boolean;
  livestock: boolean;
  forageCrop: boolean;
}

interface Equipment {
  id: string;
  type: string;
  manufacturer: string;
  model: string;
  horsepower: string;
  year: string;
  usageHours: string;
  condition: number;
  images: string[];
  saleType: "new" | "used" | null;
  tradeType: string;
  desiredPrice: string;
  saleStatus: string;
  attachments?: Array<{
    type: "loader" | "rotary" | "frontWheel" | "rearWheel";
    manufacturer: string;
    model: string;
    condition?: number;
    memo?: string;
    images?: (string | File | null)[];
  }>;
}

export default function EditFarmerPage({ params }: PageProps) {
  const { id } = params;
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const farmerDoc = await getDoc(doc(db, 'farmers', id));
        if (farmerDoc.exists()) {
          setInitialData({
            ...farmerDoc.data() as FormData,
            id: farmerDoc.id
          });
        } else {
          setError('농민 데이터를 찾을 수 없습니다.');
          toast.error('농민 데이터를 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('농민 데이터 로딩 중 오류 발생:', error);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmer();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-bold mb-2">오류 발생</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">데이터를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <EditFarmerClient 
      farmerId={id}
      initialData={initialData}
      onClose={() => router.push('/farmers')}
      onUpdate={() => router.refresh()}
    />
  );
} 