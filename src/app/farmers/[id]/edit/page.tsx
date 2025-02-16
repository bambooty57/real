'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import NewFarmer from '../../new/NewFarmer';
import { FormData } from '@/types/farmer';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditFarmerPage({ params }: PageProps) {
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setInitialData(docSnap.data() as FormData);
        } else {
          setError('농민 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching farmer:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmer();
  }, [params.id]);

  if (loading) return <div>데이터를 불러오는 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <NewFarmer 
        mode="edit"
        farmerId={params.id}
        initialData={initialData}
      />
    </div>
  );
} 