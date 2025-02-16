'use client';

import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import type { Farmer } from '@/types/farmer';

export default function Dashboard() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFarmers = useCallback(async () => {
    try {
      const farmersRef = collection(db, 'farmers');
      const q = query(farmersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[];
      setFarmers(farmersData);
    } catch (err) {
      console.error('Error loading farmers:', err);
      setError('농민 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFarmers();
  }, [loadFarmers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">에러: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmers.map((farmer) => (
          <div key={farmer.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold">{farmer.name}</h2>
            <p>{farmer.phone}</p>
            <p>{farmer.address}</p>
            <Link href={`/farmers/${farmer.id}`} className="text-blue-500 hover:text-blue-700">
              자세히 보기
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 