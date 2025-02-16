'use client';

import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import { FormData } from '@/types/farmer';
import { toast } from 'react-hot-toast';

// 동적 import로 NewFarmer 컴포넌트 로드
const NewFarmer = dynamic(() => import('../../new/NewFarmer'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  ),
  ssr: false
});

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
          const data = docSnap.data() as FormData;
          console.log('Farmer data loaded:', data);  // 데이터 로딩 확인
          setInitialData(data);
        } else {
          console.error('No farmer found with ID:', params.id);
          setError('농민 정보를 찾을 수 없습니다.');
          toast.error('농민 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('Error fetching farmer:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmer();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농민 정보 수정</h1>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }>
        <NewFarmer 
          mode="edit"
          farmerId={params.id}
          initialData={initialData}
        />
      </Suspense>
    </div>
  );
} 