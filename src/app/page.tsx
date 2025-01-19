'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface Farmer {
  id: string;
  name: string;
  address: string;
  phone: string;
  ageGroup: string;
  mainCrop: {
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
  };
  equipments: Array<{
    type: string;
    manufacturer: string;
  }>;
}

const getMainCropText = (mainCrop: Farmer['mainCrop']) => {
  if (!mainCrop) return '없음';
  
  const selectedCrops = Object.entries(mainCrop)
    .filter(([_, value]) => value)
    .map(([key, _]) => {
      const cropNames = {
        rice: '벼',
        barley: '보리',
        hanwoo: '한우',
        soybean: '콩',
        sweetPotato: '고구마',
        persimmon: '감',
        pear: '배',
        plum: '자두',
        sorghum: '수수',
        goat: '염소',
        other: '기타'
      };
      return cropNames[key];
    });
  
  return selectedCrops.length > 0 ? selectedCrops.join(', ') : '없음';
};

export default function Home() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        console.log('Fetching farmers...');  // 디버깅용 로그
        const farmersRef = collection(db, 'farmers');
        const snapshot = await getDocs(farmersRef);
        const farmersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Farmer));
        console.log('Farmers data:', farmersData);  // 디버깅용 로그
        setFarmers(farmersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching farmers:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
        setLoading(false);
      }
    };

    fetchFarmers();
  }, []);

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (loading) {
    return <div className="text-center py-10">데이터를 불러오는 중...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">농민 목록</h1>
        <Link 
          href="/farmers/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          새 농민 등록
        </Link>
      </div>

      {farmers.length === 0 ? (
        <p className="text-center py-10 text-gray-500">등록된 농민이 없습니다.</p>
      ) : (
        <div className="grid gap-4">
          {farmers.map((farmer) => (
            <Link 
              key={farmer.id} 
              href={`/farmers/${farmer.id}`}
              className="block p-4 border rounded hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold">{farmer.name}</h2>
                  <p className="text-gray-600">{farmer.address}</p>
                  <p className="text-gray-600">{farmer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{farmer.ageGroup}</p>
                  <p className="text-sm text-gray-500">{getMainCropText(farmer.mainCrop)}</p>
                  <p className="text-sm text-gray-500">
                    {farmer.equipments?.[0]?.type} ({farmer.equipments?.[0]?.manufacturer})
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 