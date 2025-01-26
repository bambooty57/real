'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { getFarmingTypeDisplay } from '@/utils/display';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmingType, setSelectedFarmingType] = useState<string>('');
  const [selectedMainCrop, setSelectedMainCrop] = useState<string>('');

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const farmersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Farmer[];
        setFarmers(farmersData);
      } catch (error) {
        console.error('Error fetching farmers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, []);

  // 필터링 로직
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      farmer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farmer.roadAddress?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFarmingType = !selectedFarmingType || 
      (farmer.farmingTypes && farmer.farmingTypes[selectedFarmingType as keyof typeof farmer.farmingTypes]);

    const matchesMainCrop = !selectedMainCrop || 
      (farmer.mainCrop && farmer.mainCrop[selectedMainCrop as keyof typeof farmer.mainCrop]);

    return matchesSearch && matchesFarmingType && matchesMainCrop;
  });

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">농민 목록</h1>
        <Link 
          href="/farmers/new" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          새 농민 등록
        </Link>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 검색어 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              검색
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 전화번호, 상호, 주소로 검색"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 영농형태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              영농형태
            </label>
            <select
              value={selectedFarmingType}
              onChange={(e) => setSelectedFarmingType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="waterPaddy">수도작</option>
              <option value="fieldFarming">밭농사</option>
              <option value="orchard">과수원</option>
              <option value="livestock">축산업</option>
              <option value="forageCrop">사료작물</option>
            </select>
          </div>

          {/* 주작물 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              주작물
            </label>
            <select
              value={selectedMainCrop}
              onChange={(e) => setSelectedMainCrop(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="foodCrops">식량작물</option>
              <option value="facilityHort">시설원예</option>
              <option value="fieldVeg">노지채소</option>
              <option value="fruits">과수</option>
              <option value="specialCrops">특용작물</option>
              <option value="flowers">화훼</option>
            </select>
          </div>
        </div>
      </div>

      {/* 농민 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map((farmer) => (
          <Link 
            key={farmer.id} 
            href={`/farmers/${farmer.id}`}
            className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="font-bold text-lg mb-2">{farmer.name}</div>
            <div className="text-gray-600 mb-1">{farmer.phone}</div>
            {farmer.businessName && (
              <div className="text-gray-600 mb-1">{farmer.businessName}</div>
            )}
            <div className="text-gray-500 text-sm">
              {farmer.roadAddress || farmer.jibunAddress}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">영농형태: </span>
              {Object.entries(farmer.farmingTypes || {})
                .filter(([_, value]) => value)
                .map(([key]) => getFarmingTypeDisplay(key))
                .join(', ')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 