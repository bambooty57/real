'use client';

import { useState, useEffect } from 'react';
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
  const [selectedFarmingType, setSelectedFarmingType] = useState('');
  const [selectedMainCrop, setSelectedMainCrop] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedMailOption, setSelectedMailOption] = useState('all');
  const farmersPerPage = 15;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 시/군/구 목록
  const cities = [
    { value: '나주시', label: '나주시' },
    { value: '목포시', label: '목포시' },
    { value: '순천시', label: '순천시' },
    { value: '여수시', label: '여수시' },
    { value: '광양시', label: '광양시' },
    { value: '담양군', label: '담양군' },
    { value: '곡성군', label: '곡성군' },
    { value: '구례군', label: '구례군' },
    { value: '고흥군', label: '고흥군' },
    { value: '보성군', label: '보성군' },
    { value: '화순군', label: '화순군' },
    { value: '장흥군', label: '장흥군' },
    { value: '강진군', label: '강진군' },
    { value: '해남군', label: '해남군' },
    { value: '영암군', label: '영암군' },
    { value: '무안군', label: '무안군' },
    { value: '함평군', label: '함평군' },
    { value: '영광군', label: '영광군' },
    { value: '장성군', label: '장성군' },
    { value: '완도군', label: '완도군' },
    { value: '진도군', label: '진도군' },
    { value: '신안군', label: '신안군' }
  ];

  // 선택된 시/군/구에 따른 읍/면/동 목록
  const getDistricts = (city: string) => {
    const districtMap: { [key: string]: Array<{ value: string, label: string }> } = {
      '나주시': [
        { value: '남평읍', label: '남평읍' },
        { value: '세지면', label: '세지면' },
        { value: '왕곡면', label: '왕곡면' },
        { value: '반남면', label: '반남면' },
        { value: '공산면', label: '공산면' },
        { value: '동강면', label: '동강면' },
        { value: '다시면', label: '다시면' },
        { value: '문평면', label: '문평면' },
        { value: '노안면', label: '노안면' },
        { value: '금천면', label: '금천면' },
        { value: '산포면', label: '산포면' },
        { value: '다도면', label: '다도면' },
        { value: '봉황면', label: '봉황면' }
      ],
      '담양군': [
        { value: '담양읍', label: '담양읍' },
        { value: '고서면', label: '고서면' },
        { value: '창평면', label: '창평면' },
        { value: '대덕면', label: '대덕면' },
        { value: '무정면', label: '무정면' },
        { value: '금성면', label: '금성면' },
        { value: '용면', label: '용면' },
        { value: '월산면', label: '월산면' },
        { value: '수북면', label: '수북면' },
        { value: '대전면', label: '대전면' },
        { value: '봉산면', label: '봉산면' },
        { value: '가사문학면', label: '가사문학면' }
      ],
      '장성군': [
        { value: '장성읍', label: '장성읍' },
        { value: '진원면', label: '진원면' },
        { value: '남면', label: '남면' },
        { value: '동화면', label: '동화면' },
        { value: '삼서면', label: '삼서면' },
        { value: '삼계면', label: '삼계면' },
        { value: '황룡면', label: '황룡면' },
        { value: '서삼면', label: '서삼면' },
        { value: '북일면', label: '북일면' },
        { value: '북이면', label: '북이면' },
        { value: '북하면', label: '북하면' }
      ]
      // 나머지 시군구별 읍면동은 필요에 따라 추가...
    };
    return districtMap[city] || [];
  };

  // 선택된 읍/면/동에 따른 리 목록
  const getVillages = (city: string, district: string) => {
    const villageMap: { [key: string]: { [key: string]: Array<{ value: string, label: string }> } } = {
      '나주시': {
        '남평읍': [
          { value: '남석리', label: '남석리' },
          { value: '대교리', label: '대교리' },
          { value: '교원리', label: '교원리' },
          { value: '오계리', label: '오계리' },
          { value: '서산리', label: '서산리' },
          { value: '동사리', label: '동사리' },
          { value: '광촌리', label: '광촌리' }
        ],
        '세지면': [
          { value: '내정리', label: '내정리' },
          { value: '동신리', label: '동신리' },
          { value: '대산리', label: '대산리' },
          { value: '성산리', label: '성산리' },
          { value: '덕산리', label: '덕산리' }
        ]
      },
      '담양군': {
        '담양읍': [
          { value: '백동리', label: '백동리' },
          { value: '천변리', label: '천변리' },
          { value: '양각리', label: '양각리' },
          { value: '가산리', label: '가산리' },
          { value: '운교리', label: '운교리' }
        ],
        '고서면': [
          { value: '성월리', label: '성월리' },
          { value: '주산리', label: '주산리' },
          { value: '원강리', label: '원강리' },
          { value: '덕촌리', label: '덕촌리' }
        ]
      }
      // 나머지 읍면동별 리는 필요에 따라 추가...
    };
    return villageMap[city]?.[district] || [];
  };

  // 지역 선택 변경 핸들러들
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

  // 주소에서 지역 정보 추출 함수
  const parseAddress = (address: string | undefined) => {
    if (!address) return { city: '', district: '', village: '' };

    // 전라남도로 시작하는지 확인
    if (!address.startsWith('전라남도')) {
      return { city: '', district: '', village: '' };
    }

    let city = '';
    let district = '';
    let village = '';

    // 시/군 추출
    for (const cityOption of cities) {
      if (address.includes(cityOption.value)) {
        city = cityOption.value;
        break;
      }
    }

    // 읍/면/동 추출
    if (city) {
      const districts = getDistricts(city);
      for (const districtOption of districts) {
        if (address.includes(districtOption.value)) {
          district = districtOption.value;
          break;
        }
      }
    }

    // 리 추출
    if (city && district) {
      const villages = getVillages(city, district);
      for (const villageOption of villages) {
        if (address.includes(villageOption.value)) {
          village = villageOption.value;
          break;
        }
      }
    }

    return { city, district, village };
  };

  // 필터링 로직 수정
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = searchTerm === '' || [
      farmer.name,
      farmer.phone,
      farmer.businessName,
      farmer.roadAddress
    ].some(field => field?.toLowerCase?.()?.includes(searchTerm.toLowerCase()));

    // 주소에서 지역 정보 추출
    const addressParts = parseAddress(farmer.roadAddress || farmer.jibunAddress);
    
    // 지역 매칭 확인
    const matchesRegion = (!selectedCity || addressParts.city === selectedCity) &&
      (!selectedDistrict || addressParts.district === selectedDistrict) &&
      (!selectedVillage || addressParts.village === selectedVillage);

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

  if (loading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-4">
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
              placeholder="이름, 전화번호, 상호로 검색"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* 지역 필터 - 시/군/구 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시/군/구
            </label>
            <select
              value={selectedCity}
              onChange={handleCityChange}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              {cities.map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
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
              {getDistricts(selectedCity).map(district => (
                <option key={district.value} value={district.value}>
                  {district.label}
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
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={!selectedDistrict}
            >
              <option value="">전체</option>
              {getVillages(selectedCity, selectedDistrict).map(village => (
                <option key={village.value} value={village.value}>
                  {village.label}
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
                    <SwiperSlide key={`farmer-${index}`}>
                      <Image
                        src={image.toString()}
                        alt={`${farmer.name}의 사진 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </SwiperSlide>
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
                  <>
                    {/* 농기계 이미지 */}
                    {equipment.images?.map((image, imgIndex) => (
                      <SwiperSlide key={`eq-${eqIndex}-${imgIndex}`}>
                        <Image
                          src={image.toString()}
                          alt={`${getKoreanEquipmentType(equipment.type)} 사진 ${imgIndex + 1}`}
                          fill
                          className="object-cover"
                        />
                      </SwiperSlide>
                    ))}

                    {/* 부착장비 이미지 */}
                    {equipment.attachments?.map((attachment, attIndex) => 
                      attachment.images?.map((image, imgIndex) => (
                        <SwiperSlide key={`att-${eqIndex}-${attIndex}-${imgIndex}`}>
                          <Image
                            src={image.toString()}
                            alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 사진 ${imgIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </SwiperSlide>
                      ))
                    )}
                  </>
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
          {/* 처음으로 버튼 */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            처음으로
          </button>

          {/* 이전 버튼 */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            이전
          </button>

          {/* 페이지 번호들 */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                disabled={currentPage === pageNum}
                className={`px-4 py-2 border rounded ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {/* 다음 버튼 */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            다음
          </button>

          {/* 끝으로 버튼 */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50 hover:bg-gray-100"
          >
            끝으로
          </button>
        </div>
      )}
    </div>
  );
}