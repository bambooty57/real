'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { getFarmingTypeDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedFarmingType, setSelectedFarmingType] = useState('');
  const [selectedMainCrop, setSelectedMainCrop] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMailOption, setSelectedMailOption] = useState('all');
  const farmersPerPage = 15;

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
    const matchesSearch = searchTerm === '' || [
      farmer.name,
      farmer.phone,
      farmer.businessName,
      farmer.roadAddress
    ].some(field => field?.toLowerCase?.()?.includes(searchTerm.toLowerCase()));

    const matchesRegion = !selectedRegion || 
      farmer.roadAddress?.includes(selectedRegion);

    const matchesFarmingType = !selectedFarmingType || 
      (farmer.farmingTypes && farmer.farmingTypes[selectedFarmingType as keyof typeof farmer.farmingTypes]);

    const matchesMainCrop = !selectedMainCrop || 
      (farmer.mainCrop && farmer.mainCrop[selectedMainCrop as keyof typeof farmer.mainCrop]);

    const matchesEquipment = !selectedEquipment ||
      farmer.equipments?.some(eq => eq.type === selectedEquipment);

    const matchesMailOption = selectedMailOption === 'all' || 
      (selectedMailOption === 'yes' ? farmer.canReceiveMail : !farmer.canReceiveMail);

    return matchesSearch && matchesRegion && matchesFarmingType && 
           matchesMainCrop && matchesEquipment && matchesMailOption;
  });

  // 페이지네이션 로직
  const indexOfLastFarmer = currentPage * farmersPerPage;
  const indexOfFirstFarmer = indexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(indexOfFirstFarmer, indexOfLastFarmer);
  const totalPages = Math.ceil(filteredFarmers.length / farmersPerPage);

  const handleDelete = async (farmerId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'farmers', farmerId));
        setFarmers(prev => prev.filter(farmer => farmer.id !== farmerId));
        toast.success('삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting farmer:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

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

          {/* 지역 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              지역
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="전라남도">전라남도</option>
              <option value="전라북도">전라북도</option>
              <option value="경상남도">경상남도</option>
              <option value="경상북도">경상북도</option>
              <option value="충청남도">충청남도</option>
              <option value="충청북도">충청북도</option>
              <option value="강원도">강원도</option>
              <option value="경기도">경기도</option>
            </select>
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

          {/* 농기계 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              보유 농기계
            </label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="tractor">트랙터</option>
              <option value="combine">콤바인</option>
              <option value="rice_transplanter">이앙기</option>
              <option value="cultivator">경운기</option>
              <option value="excavator">굴삭기</option>
            </select>
          </div>

          {/* 우편수취여부 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우편수취여부
            </label>
            <select
              value={selectedMailOption}
              onChange={(e) => setSelectedMailOption(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="yes">가능</option>
              <option value="no">불가능</option>
            </select>
          </div>
        </div>
      </div>

      {/* 농민 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFarmers.map((farmer) => (
          <div key={farmer.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            {/* 이미지 갤러리 */}
            <div className="relative h-48 rounded-t-lg overflow-hidden">
              {farmer.farmerImages && farmer.farmerImages.length > 0 ? (
                <Image
                  src={farmer.farmerImages[0]}
                  alt={`${farmer.name}의 대표 이미지`}
                  layout="fill"
                  objectFit="cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">이미지 없음</span>
                </div>
              )}
            </div>

            {/* 농민 정보 */}
            <div className="p-4">
              <div className="font-bold text-lg mb-2">{farmer.name}</div>
              <div className="text-gray-600 mb-1">{farmer.phone}</div>
              {farmer.businessName && (
                <div className="text-gray-600 mb-1">{farmer.businessName}</div>
              )}
              <div className="text-gray-500 text-sm mb-2">
                {farmer.roadAddress || farmer.jibunAddress}
              </div>
              
              {/* 영농형태 */}
              <div className="mb-2">
                <span className="font-medium">영농형태: </span>
                <span className="text-sm">
                  {Object.entries(farmer.farmingTypes || {})
                    .filter(([_, value]) => value)
                    .map(([key]) => getFarmingTypeDisplay(key))
                    .join(', ')}
                </span>
              </div>

              {/* 보유 농기계 */}
              {farmer.equipments && farmer.equipments.length > 0 && (
                <div className="mb-2">
                  <span className="font-medium">보유 농기계: </span>
                  <span className="text-sm">
                    {farmer.equipments.map(eq => getKoreanEquipmentType(eq.type)).join(', ')}
                  </span>
                </div>
              )}

              {/* 우편수취여부 */}
              <div className="mb-4">
                <span className="font-medium">우편수취: </span>
                <span className={`text-sm ${farmer.canReceiveMail ? 'text-green-600' : 'text-red-600'}`}>
                  {farmer.canReceiveMail ? 'O' : 'X'}
                </span>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-between mt-4">
                <Link
                  href={`/farmers/${farmer.id}`}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  상세보기
                </Link>
                <button
                  onClick={() => handleDelete(farmer.id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            이전
          </button>
          <span className="px-4 py-2">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}