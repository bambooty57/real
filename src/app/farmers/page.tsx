'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { getFarmingTypeDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { BiRefresh } from 'react-icons/bi';

export default function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [availableCities, setAvailableCities] = useState<Set<string>>(new Set());
  const [districtsByCity, setDistrictsByCity] = useState<Map<string, Set<string>>>(new Map());
  const [villagesByDistrict, setVillagesByDistrict] = useState<Map<string, Set<string>>>(new Map());
  const [selectedFarmingType, setSelectedFarmingType] = useState('');
  const [selectedMainCrop, setSelectedMainCrop] = useState('');
  const [selectedMailOption, setSelectedMailOption] = useState('all');
  const [selectedSaleType, setSelectedSaleType] = useState('all');
  const farmersPerPage = 15;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);

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
        
        // 주소 데이터 추출 - 시/군별 읍면동 매핑
        const cities = new Set<string>();
        const districtsByCity = new Map<string, Set<string>>();
        const villagesByDistrict = new Map<string, Set<string>>();

        // 전라남도 시/군 추가
        [
          '목포시', '여수시', '순천시', '나주시', '광양시', 
          '담양군', '곡성군', '구례군', '고흥군', '보성군',
          '화순군', '장흥군', '강진군', '해남군', '영암군',
          '무안군', '함평군', '영광군', '장성군', '완도군',
          '진도군', '신안군'
        ].forEach(city => {
          cities.add(city);
          districtsByCity.set(city, new Set<string>());
        });

        // 주소에서 읍면동, 리 추출
        farmersData.forEach(farmer => {
          const address = farmer.jibunAddress || farmer.roadAddress;
          if (!address?.startsWith('전라남도')) return;

          const parts = address.split(' ');
          if (parts.length < 3) return;

          const city = parts[1];
          const district = parts[2];
          const village = parts[3];

          if (city && district) {
            const cityDistricts = districtsByCity.get(city) || new Set<string>();
            cityDistricts.add(district);
            districtsByCity.set(city, cityDistricts);

            if (district && village) {
              const districtVillages = villagesByDistrict.get(district) || new Set<string>();
              districtVillages.add(village);
              villagesByDistrict.set(district, districtVillages);
            }
          }
        });

        setAvailableCities(cities);
        setDistrictsByCity(districtsByCity);
        setVillagesByDistrict(villagesByDistrict);
      } catch (error) {
        console.error('Error fetching farmers:', error);
        toast.error('데이터 로딩 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmers();
  }, []);

  // 선택된 시/군에 해당하는 읍/면/동 목록 가져오기
  const getAvailableDistricts = () => {
    if (!selectedCity) return [];
    const districts = districtsByCity.get(selectedCity) || new Set<string>();
    return Array.from(districts).sort();
  };

  // 선택된 읍/면/동에 해당하는 리 목록 가져오기
  const getAvailableVillages = () => {
    if (!selectedDistrict) return [];
    const villages = villagesByDistrict.get(selectedDistrict) || new Set<string>();
    return Array.from(villages).sort();
  };

  // 지역 선택 핸들러 수정
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSelectedCity(city);
    setSelectedDistrict('');
    setSelectedVillage('');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setSelectedDistrict(district);
    setSelectedVillage('');
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVillage(e.target.value);
  };

  // 필터링 로직 단순화
  const filteredFarmers = farmers.filter(farmer => {
    // 1. 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const searchTarget = [
        farmer.name,
        farmer.phone,
        farmer.businessName,
        farmer.jibunAddress,
        farmer.roadAddress
      ].join(' ').toLowerCase();
      
      if (!searchTarget.includes(searchLower)) return false;
    }

    // 2. 주소 필터
    if (selectedCity || selectedDistrict || selectedVillage) {
      const address = farmer.jibunAddress || farmer.roadAddress;
      if (!address) return false;

      if (selectedCity && !address.includes(selectedCity)) return false;
      if (selectedDistrict && !address.includes(selectedDistrict)) return false;
      if (selectedVillage && !address.includes(selectedVillage)) return false;
    }

    // 3. 영농형태 필터
    if (selectedFarmingType && (!farmer.farmingTypes || !farmer.farmingTypes[selectedFarmingType as keyof typeof farmer.farmingTypes])) {
      return false;
    }

    // 4. 우편수취여부 필터
    if (selectedMailOption !== 'all') {
      if (selectedMailOption === 'yes' && !farmer.canReceiveMail) return false;
      if (selectedMailOption === 'no' && farmer.canReceiveMail) return false;
    }

    // 5. 판매유형 필터
    if (selectedSaleType !== 'all') {
      if (!farmer.equipments?.some(eq => eq?.saleType === selectedSaleType)) {
        return false;
      }
    }

    return true;
  });

  // 페이지네이션 로직
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmersPerPage));
  // 현재 페이지가 총 페이지 수를 초과하지 않도록 보정
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const safeIndexOfLastFarmer = safeCurrentPage * farmersPerPage;
  const safeIndexOfFirstFarmer = safeIndexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(safeIndexOfFirstFarmer, safeIndexOfLastFarmer);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[];
      setFarmers(farmersData);
      toast.success('목록이 새로고침되었습니다.');
    } catch (error) {
      console.error('Error refreshing farmers:', error);
      toast.error('새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFarmers(currentFarmers.map(farmer => farmer.id));
    } else {
      setSelectedFarmers([]);
    }
  };

  // 개별 선택/해제 핸들러
  const handleSelectFarmer = (farmerId: string, checked: boolean) => {
    if (checked) {
      setSelectedFarmers(prev => [...prev, farmerId]);
    } else {
      setSelectedFarmers(prev => prev.filter(id => id !== farmerId));
    }
  };

  // 선택된 농민 삭제 핸들러
  const handleDeleteSelected = async () => {
    if (!selectedFarmers.length) return;
    
    if (window.confirm(`선택한 ${selectedFarmers.length}명의 농민을 삭제하시겠습니까?`)) {
      try {
        await Promise.all(selectedFarmers.map(id => deleteDoc(doc(db, 'farmers', id))));
        setFarmers(prev => prev.filter(farmer => !selectedFarmers.includes(farmer.id)));
        setSelectedFarmers([]);
        toast.success('선택한 농민들이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting farmers:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">농민 목록</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full hover:bg-gray-100 transition-all ${
              isRefreshing ? 'opacity-50' : ''
            }`}
          >
            <BiRefresh 
              className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {selectedFarmers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              선택 삭제 ({selectedFarmers.length})
            </button>
          )}
          <Link 
            href="/farmers/new" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            새 농민 등록
          </Link>
        </div>
      </div>

      {/* 필터 섹션 위에 전체 선택 체크박스 추가 */}
      <div className="mb-4 flex items-center">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedFarmers.length === currentFarmers.length && currentFarmers.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span className="text-gray-700">전체 선택</span>
        </label>
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
              placeholder="이름, 전화번호, 상호로 검색"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 지역 필터 - 시/군 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시/군
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              {Array.from(availableCities).sort().map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* 지역 필터 - 읍/면/동 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              읍/면/동
            </label>
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full p-2 border rounded"
              disabled={!selectedCity}
            >
              <option value="">전체</option>
              {getAvailableDistricts().map(district => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          {/* 지역 필터 - 리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              리
            </label>
            <select
              value={selectedVillage}
              onChange={handleVillageChange}
              className="w-full p-2 border rounded"
              disabled={!selectedDistrict}
            >
              <option value="">전체</option>
              {getAvailableVillages().map(village => (
                <option key={village} value={village}>
                  {village}
                </option>
              ))}
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

          {/* 판매유형 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              판매유형
            </label>
            <select
              value={selectedSaleType}
              onChange={(e) => setSelectedSaleType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="new">신규</option>
              <option value="used">중고</option>
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
          <div key={farmer.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow relative">
            {/* 체크박스 추가 */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedFarmers.includes(farmer.id)}
                onChange={(e) => handleSelectFarmer(farmer.id, e.target.checked)}
                className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300"
              />
            </div>

            {/* 이미지 갤러리 */}
            <div className="relative h-48 rounded-t-lg overflow-hidden farmer-image-gallery">
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true }}
                className="h-full"
              >
                {/* 기본 사진들 */}
                {farmer.farmerImages && farmer.farmerImages.length > 0 ? (
                  farmer.farmerImages.map((image, index) => (
                    image && (
                      <SwiperSlide key={`farmer-${index}`}>
                        <div className="relative w-full h-full">
                          <Image
                            src={image.toString()}
                            alt={`${farmer.name}의 사진 ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={(e: any) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    )
                  ))
                ) : (
                  <SwiperSlide>
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">이미지 없음</span>
                    </div>
                  </SwiperSlide>
                )}

                {/* 농기계 및 부착장비 사진들 */}
                {farmer.equipments?.map((equipment, eqIndex) => (
                  <React.Fragment key={`eq-fragment-${eqIndex}`}>
                    {/* 농기계 이미지 */}
                    {equipment.images?.filter(Boolean).map((image, imgIndex) => (
                      <SwiperSlide key={`eq-${eqIndex}-${imgIndex}`}>
                        <div className="relative w-full h-full">
                          <Image
                            src={image.toString()}
                            alt={`${getKoreanEquipmentType(equipment.type)} 사진 ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                            onError={(e: any) => {
                              e.target.src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}

                    {/* 부착장비 이미지 */}
                    {equipment.attachments?.map((attachment, attIndex) => 
                      attachment.images?.filter(Boolean).map((image, imgIndex) => (
                        <SwiperSlide key={`att-${eqIndex}-${attIndex}-${imgIndex}`}>
                          <div className="relative w-full h-full">
                            <Image
                              src={image.toString()}
                              alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 사진 ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                              onError={(e: any) => {
                                e.target.src = '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                        </SwiperSlide>
                      ))
                    )}
                  </React.Fragment>
                ))}
              </Swiper>
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
      {filteredFarmers.length > 0 && (
        <div className="mt-6">
          {/* 페이지 정보 */}
          <div className="text-center mb-4 text-gray-600">
            전체 {filteredFarmers.length}개 중 {safeIndexOfFirstFarmer + 1}-{Math.min(safeIndexOfLastFarmer, filteredFarmers.length)}
            <span className="mx-2">|</span>
            페이지 {safeCurrentPage}/{totalPages}
          </div>
          
          {/* 페이지 버튼 */}
          <div className="flex justify-center items-center space-x-1">
            {/* 처음으로 */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#171;
            </button>

            {/* 이전 */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#8249;
            </button>

            {/* 페이지 번호들 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pageNum => {
                if (totalPages <= 7) return true;
                if (pageNum === 1 || pageNum === totalPages) return true;
                if (pageNum >= safeCurrentPage - 2 && pageNum <= safeCurrentPage + 2) return true;
                return false;
              })
              .map((pageNum, index, array) => {
                // 줄임표 표시 로직
                if (index > 0 && pageNum > array[index - 1] + 1) {
                  return (
                    <React.Fragment key={`ellipsis-${pageNum}`}>
                      <span className="px-2 py-1">...</span>
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          safeCurrentPage === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      safeCurrentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

            {/* 다음 */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#8250;
            </button>

            {/* 끝으로 */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="px-2 py-1 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              &#187;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}