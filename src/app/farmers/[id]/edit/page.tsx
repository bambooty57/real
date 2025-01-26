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

export default function EditFarmerPage({ params }: PageProps) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFarmerData() {
      try {
        const docRef = doc(db, 'farmers', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInitialData({
            id: docSnap.id,
            name: data.name || '',
            phone: data.phone || '',
            businessName: data.businessName,
            zipCode: data.zipCode,
            roadAddress: data.roadAddress,
            jibunAddress: data.jibunAddress,
            addressDetail: data.addressDetail,
            canReceiveMail: data.canReceiveMail,
            ageGroup: data.ageGroup,
            memo: data.memo,
            farmerImages: data.farmerImages,
            mainCrop: data.mainCrop,
            farmingTypes: data.farmingTypes,
            equipments: data.equipments,
            rating: data.rating
          });
        } else {
          setError('농민 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error('Error fetching farmer data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFarmerData();
  }, [id]);

  if (loading) {
    return <div>데이터를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <NewFarmer mode="edit" farmerId={id} initialData={initialData} />
      </Suspense>
    </div>
  );
} 