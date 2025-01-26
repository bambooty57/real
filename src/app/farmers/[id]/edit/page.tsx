'use client';

import { Suspense, useEffect, useState } from 'react';
import { use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import NewFarmer from '../../new/NewFarmer';
import { FormData } from '@/types/farmer';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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
  const { id } = use(params);
  const [initialData, setInitialData] = useState<FormData | null>(null);

  useEffect(() => {
    const fetchFarmer = async () => {
      const docRef = doc(db, 'farmers', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as FormData;
        setInitialData(data);
      }
    };

    fetchFarmer();
  }, [id]);

  if (!initialData) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <NewFarmer mode="edit" farmerId={id} initialData={initialData} />
      </Suspense>
    </div>
  );
} 