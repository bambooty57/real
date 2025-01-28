'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { getFarmingTypeDisplay, getKoreanEquipmentType, getKoreanManufacturer, getMainCropText } from '@/utils/mappings';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { BiRefresh } from 'react-icons/bi';
import { FaPrint, FaFileExcel } from 'react-icons/fa';
import FarmerDetailModal from '@/components/FarmerDetailModal';
import { Dialog } from '@headlessui/react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useSearchFilter } from '@/contexts/SearchFilterContext'

// 전화번호 포맷팅 함수
const formatPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

export default function FarmersPage() {
  const { filterState, setFilterState } = useSearchFilter()
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [availableCities, setAvailableCities] = useState<Set<string>>(new Set())
  const [districtsByCity, setDistrictsByCity] = useState<Map<string, Set<string>>>(new Map())
  const [villagesByDistrict, setVillagesByDistrict] = useState<Map<string, Set<string>>>(new Map())
  const farmersPerPage = 15  // 페이지당 표시할 농민 수

  // URL 쿼리 파라미터 관리 함수
  const updateQueryParams = (params: Record<string, string>) => {
    if (typeof window === 'undefined') return
    const searchParams = new URLSearchParams(window.location.search)
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value)
      } else {
        searchParams.delete(key)
      }
    })
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`
    window.history.replaceState({}, '', newUrl)
  }

  // 초기 필터 상태 설정
  useEffect(() => {
    if (typeof window === 'undefined') return
    const searchParams = new URLSearchParams(window.location.search)
    
    const initialFilters = {
      searchTerm: searchParams.get('search') || '',
      selectedCity: searchParams.get('city') || '',
      selectedDistrict: searchParams.get('district') || '',
      selectedVillage: searchParams.get('village') || '',
      selectedFarmingType: searchParams.get('farmingType') || '',
      selectedMainCrop: searchParams.get('mainCrop') || '',
      selectedMailOption: searchParams.get('mailOption') || 'all',
      selectedSaleType: searchParams.get('saleType') || 'all',
      selectedEquipmentType: searchParams.get('equipmentType') || '',
      selectedManufacturer: searchParams.get('manufacturer') || ''
    }

    setFilterState(initialFilters)
  }, [])

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
    if (!filterState.selectedCity) return [];
    const districts = districtsByCity.get(filterState.selectedCity) || new Set<string>();
    return Array.from(districts).sort();
  };

  // 선택된 읍/면/동에 해당하는 리 목록 가져오기
  const getAvailableVillages = () => {
    if (!filterState.selectedDistrict) return [];
    const villages = villagesByDistrict.get(filterState.selectedDistrict) || new Set<string>();
    return Array.from(villages).sort();
  };

  // 지역 선택 핸들러 수정
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedCity: city,
      selectedDistrict: '',
      selectedVillage: ''
    }))
    updateQueryParams({ city, district: '', village: '' })
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedDistrict: district,
      selectedVillage: ''
    }))
    updateQueryParams({ district, village: '' })
  }

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const village = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedVillage: village
    }))
    updateQueryParams({ village })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value
    setFilterState(prev => ({
      ...prev,
      searchTerm: search
    }))
    updateQueryParams({ search })
  }

  const handleFarmingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const farmingType = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedFarmingType: farmingType
    }))
    updateQueryParams({ farmingType })
  }

  const handleMainCropChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mainCrop = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedMainCrop: mainCrop
    }))
    updateQueryParams({ mainCrop })
  }

  const handleMailOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mailOption = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedMailOption: mailOption
    }))
    updateQueryParams({ mailOption })
  }

  const handleSaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const saleType = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedSaleType: saleType
    }))
    updateQueryParams({ saleType })
  }

  const handleEquipmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const equipmentType = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedEquipmentType: equipmentType
    }))
    updateQueryParams({ equipmentType })
  }

  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturer = e.target.value
    setFilterState(prev => ({
      ...prev,
      selectedManufacturer: manufacturer
    }))
    updateQueryParams({ manufacturer })
  }

  // 필터링 로직 수정
  const filteredFarmers = farmers.filter(farmer => {
    // 1. 검색어 필터
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase()
      const searchTarget = [
        farmer.name,
        farmer.phone,
        farmer.businessName,
        farmer.jibunAddress,
        farmer.roadAddress
      ].join(' ').toLowerCase()
      
      if (!searchTarget.includes(searchLower)) return false
    }

    // 2. 주소 필터
    if (filterState.selectedCity || filterState.selectedDistrict || filterState.selectedVillage) {
      const address = farmer.jibunAddress || farmer.roadAddress
      if (!address) return false

      if (filterState.selectedCity && !address.includes(filterState.selectedCity)) return false
      if (filterState.selectedDistrict && !address.includes(filterState.selectedDistrict)) return false
      if (filterState.selectedVillage && !address.includes(filterState.selectedVillage)) return false
    }

    // 3. 영농형태 필터
    if (filterState.selectedFarmingType && (!farmer.farmingTypes || !farmer.farmingTypes[filterState.selectedFarmingType as keyof typeof farmer.farmingTypes])) {
      return false
    }

    // 4. 우편수취여부 필터
    if (filterState.selectedMailOption !== 'all') {
      if (filterState.selectedMailOption === 'yes' && !farmer.canReceiveMail) return false
      if (filterState.selectedMailOption === 'no' && farmer.canReceiveMail) return false
    }

    // 5. 판매유형 필터
    if (filterState.selectedSaleType !== 'all') {
      if (!farmer.equipments?.some(eq => eq?.saleType === filterState.selectedSaleType)) {
        return false
      }
    }

    // 6. 농기계 종류 필터
    if (filterState.selectedEquipmentType) {
      if (!farmer.equipments?.some(eq => eq?.type === filterState.selectedEquipmentType)) {
        return false
      }
    }

    // 7. 제조사 필터
    if (filterState.selectedManufacturer) {
      if (!farmer.equipments?.some(eq => eq?.manufacturer === filterState.selectedManufacturer)) {
        return false
      }
    }

    return true
  })

  // 페이지네이션 로직
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmersPerPage));
  // 현재 페이지가 총 페이지 수를 초과하지 않도록 보정
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const safeIndexOfLastFarmer = safeCurrentPage * farmersPerPage;
  const safeIndexOfFirstFarmer = safeIndexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(safeIndexOfFirstFarmer, safeIndexOfLastFarmer);

  // 농민 이미지 삭제 함수
  const deleteFarmerImages = async (farmerId: string) => {
    try {
      // 농민 이미지 폴더 참조
      const farmerImagesRef = ref(storage, `farmers/${farmerId}`);
      
      // 폴더 내의 모든 파일 리스트 가져오기
      const filesList = await listAll(farmerImagesRef);
      
      // 모든 파일 삭제
      const deletePromises = filesList.items.map(item => deleteObject(item));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting farmer images:', error);
      throw error;
    }
  };

  // 단일 농민 삭제 핸들러
  const handleDelete = async (farmerId: string) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        // 농민 이미지 삭제
        await deleteFarmerImages(farmerId);
        // Firestore 문서 삭제
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
      // 모든 필터 상태 초기화
      setFilterState({
        searchTerm: '',
        selectedCity: '',
        selectedDistrict: '',
        selectedVillage: '',
        selectedFarmingType: '',
        selectedMainCrop: '',
        selectedMailOption: 'all',
        selectedSaleType: 'all',
        selectedEquipmentType: '',
        selectedManufacturer: ''
      });
      setSelectedFarmers([]);
      toast.success('목록이 새로고침되었습니다.');
    } catch (error) {
      console.error('Error refreshing farmers:', error);
      toast.error('새로고침 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 전체 농민 선택 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFarmers(filteredFarmers.map(farmer => farmer.id));
    } else {
      setSelectedFarmers([]);
    }
  };

  // 개별 농민 선택 핸들러
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
        // 선택된 모든 농민의 이미지와 문서 삭제
        await Promise.all(selectedFarmers.map(async (id) => {
          await deleteFarmerImages(id);
          await deleteDoc(doc(db, 'farmers', id));
        }));
        
        setFarmers(prev => prev.filter(farmer => !selectedFarmers.includes(farmer.id)));
        setSelectedFarmers([]);
        toast.success('선택한 농민들이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting farmers:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 전체 농민 일괄 삭제 핸들러
  const handleDeleteAll = async () => {
    if (!farmers.length) return;
    
    if (window.confirm(`등록된 모든 농민(${farmers.length}명)을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
      try {
        // 모든 농민의 이미지와 문서 삭제
        await Promise.all(farmers.map(async (farmer) => {
          await deleteFarmerImages(farmer.id);
          await deleteDoc(doc(db, 'farmers', farmer.id));
        }));
        
        setFarmers([]);
        setSelectedFarmers([]);
        toast.success('모든 농민이 삭제되었습니다.');
      } catch (error) {
        console.error('Error deleting all farmers:', error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('농민 목록');

    // 헤더 설정
    const baseColumns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: '이름', key: 'name', width: 10 },
      { header: '상호', key: 'businessName', width: 15 },
      { header: '연령대', key: 'ageGroup', width: 10 },
      { header: '전화번호', key: 'phone', width: 15 },
      { header: '우편번호', key: 'zipCode', width: 10 },
      { header: '지번주소', key: 'jibunAddress', width: 30 },
      { header: '도로명주소', key: 'roadAddress', width: 30 },
      { header: '상세주소', key: 'addressDetail', width: 20 },
      { header: '우편수취가능여부', key: 'canReceiveMail', width: 15 },
      { header: '영농형태', key: 'farmingTypes', width: 15 },
      { header: '주작물', key: 'mainCrop', width: 20 }
    ];

    // 농기계 종류별 컬럼 추가
    const equipmentTypes = ['tractor', 'transplanter', 'combine', 'forklift', 'excavator', 'skidLoader'];
    const equipmentColumns: { header: string; key: string; width: number }[] = [];
    
    equipmentTypes.forEach(type => {
      const koreanType = getKoreanEquipmentType(type);
      for (let i = 1; i <= 3; i++) {
        equipmentColumns.push(
          { header: `${koreanType}${i} 제조사`, key: `${type}${i}Manufacturer`, width: 15 },
          { header: `${koreanType}${i} 모델명`, key: `${type}${i}Model`, width: 15 },
          { header: `${koreanType}${i} 거래유형`, key: `${type}${i}TradeType`, width: 15 },
          { header: `${koreanType}${i} 판매구분`, key: `${type}${i}SaleType`, width: 15 }
        );
      }
    });

    worksheet.columns = [
      ...baseColumns,
      ...equipmentColumns,
      { header: '농민정보메모', key: 'memo', width: 50 }
    ];

    // 선택된 농민들의 데이터 추가
    const farmersToExport = selectedFarmers.length > 0 
      ? farmers.filter(farmer => selectedFarmers.includes(farmer.id))
      : filteredFarmers;

    farmersToExport.forEach(farmer => {
      // 기본 데이터 준비
      const baseData = {
        id: farmer.id,
        name: farmer.name || '',
        businessName: farmer.businessName || '',
        ageGroup: farmer.ageGroup || '',
        phone: farmer.phone || '',
        zipCode: farmer.zipCode || '',
        jibunAddress: farmer.jibunAddress || '',
        roadAddress: farmer.roadAddress || '',
        addressDetail: farmer.addressDetail || '',
        canReceiveMail: farmer.canReceiveMail ? '가능' : '불가능',
        farmingTypes: Object.entries(farmer.farmingTypes || {})
          .filter(([_, value]) => value)
          .map(([key]) => getFarmingTypeDisplay(key)),
        mainCrop: getMainCropText(farmer.mainCrop) || '',
        memo: farmer.memo || ''
      };

      // 농기계 데이터 준비
      const equipmentData: { [key: string]: string } = {};
      
      equipmentTypes.forEach(type => {
        const equipments = farmer.equipments?.filter(eq => eq.type === type) || [];
        
        // 각 종류별로 최대 3대까지 정보 추가
        for (let i = 1; i <= 3; i++) {
          const equipment = equipments[i - 1];
          const prefix = `${type}${i}`;
          
          if (equipment) {
            equipmentData[`${prefix}Manufacturer`] = equipment.manufacturer || '';
            equipmentData[`${prefix}Model`] = equipment.model || '';
            equipmentData[`${prefix}TradeType`] = equipment.tradeType === 'sale' ? '판매' : 
                                                 equipment.tradeType === 'purchase' ? '구매' : '';
            equipmentData[`${prefix}SaleType`] = equipment.saleType === 'new' ? '신규' : 
                                                equipment.saleType === 'used' ? '중고' : '';
          } else {
            equipmentData[`${prefix}Manufacturer`] = '';
            equipmentData[`${prefix}Model`] = '';
            equipmentData[`${prefix}TradeType`] = '';
            equipmentData[`${prefix}SaleType`] = '';
          }
        }
      });

      // 행 추가
      worksheet.addRow({
        ...baseData,
        ...equipmentData
      });
    });

    // 엑셀 파일 생성 및 다운로드
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(blob, '농민_목록.xlsx');
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
          {/* 전체 선택 체크박스 */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedFarmers.length === filteredFarmers.length && filteredFarmers.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="text-gray-700">전체 선택 ({selectedFarmers.length}/{filteredFarmers.length})</span>
          </label>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            <FaFileExcel className="mr-2" />
            엑셀 내보내기
            {selectedFarmers.length > 0 && ` (${selectedFarmers.length})`}
          </button>
          {selectedFarmers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              선택 삭제 ({selectedFarmers.length})
            </button>
          )}
          {farmers.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              전체 일괄삭제 ({farmers.length})
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
              value={filterState.searchTerm}
              onChange={handleSearchChange}
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
              value={filterState.selectedCity}
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
              value={filterState.selectedDistrict}
              onChange={handleDistrictChange}
              className="w-full p-2 border rounded"
              disabled={!filterState.selectedCity}
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
              value={filterState.selectedVillage}
              onChange={handleVillageChange}
              className="w-full p-2 border rounded"
              disabled={!filterState.selectedDistrict}
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
              value={filterState.selectedFarmingType}
              onChange={handleFarmingTypeChange}
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
              value={filterState.selectedSaleType}
              onChange={handleSaleTypeChange}
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
              value={filterState.selectedMailOption}
              onChange={handleMailOptionChange}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="yes">가능</option>
              <option value="no">불가능</option>
            </select>
          </div>

          {/* 농기계 종류 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              농기계 종류
            </label>
            <select
              value={filterState.selectedEquipmentType}
              onChange={handleEquipmentTypeChange}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="tractor">트랙터</option>
              <option value="combine">콤바인</option>
              <option value="rice_transplanter">이앙기</option>
              <option value="forklift">지게차</option>
              <option value="excavator">굴삭기</option>
              <option value="skid_loader">스키로더</option>
              <option value="dryer">건조기</option>
              <option value="silo">싸일론</option>
              <option value="drone">드론</option>
            </select>
          </div>

          {/* 제조사 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제조사
            </label>
            <select
              value={filterState.selectedManufacturer}
              onChange={handleManufacturerChange}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="DAEDONG">대동</option>
              <option value="LS">LS</option>
              <option value="KUKJE">국제</option>
              <option value="TYM">TYM</option>
              <option value="BRANSON">브랜슨</option>
              <option value="DONGYANG">동양</option>
              <option value="ASIA">아시아</option>
              <option value="YANMAR">얀마</option>
              <option value="ISEKI">이세키</option>
              <option value="KUBOTA">구보다</option>
              <option value="JOHN_DEERE">존디어</option>
              <option value="NEW_HOLLAND">뉴홀랜드</option>
              <option value="MASSEY_FERGUSON">매시퍼거슨</option>
              <option value="HYUNDAI">현대건설기계</option>
              <option value="SAMSUNG">삼성건설기계</option>
              <option value="VOLVO">볼보건설기계</option>
              <option value="DAEWOO">대우건설기계</option>
              <option value="DOOSAN">두산인프라코어</option>
              <option value="BOBCAT">밥캣</option>
              <option value="CATERPILLAR">캐터필러</option>
              <option value="KOMATSU">코마츠</option>
              <option value="HITACHI">히타치</option>
              <option value="JCB">JCB</option>
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
            <div className="relative aspect-[4/3] rounded-t-lg overflow-hidden farmer-image-gallery">
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                            <span>농민 사진 {index + 1}/{farmer.farmerImages.length}</span>
                          </div>
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                            <span>
                              {equipment.manufacturer} {equipment.model} {getKoreanEquipmentType(equipment.type)}
                              {' '}({imgIndex + 1}/{equipment.images?.filter(Boolean).length})
                            </span>
                          </div>
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
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                              <span>
                                {getKoreanEquipmentType(equipment.type)}의 
                                {attachment.type === 'loader' ? ' 로더' :
                                 attachment.type === 'rotary' ? ' 로터리' :
                                 attachment.type === 'frontWheel' ? ' 전륜' :
                                 attachment.type === 'rearWheel' ? ' 후륜' : 
                                 ` ${attachment.type}`}
                                {' '}({imgIndex + 1}/{attachment.images?.filter(Boolean).length})
                              </span>
                            </div>
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
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{farmer.name}</h3>
                <button
                  onClick={() => {
                    setSelectedFarmer(farmer);
                    setIsModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  상세보기
                </button>
              </div>
              <div className="space-y-2">
                <p className="flex items-center">
                  <span className="font-medium mr-2">전화:</span>
                  <a 
                    href={`tel:${farmer.phone}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {formatPhoneNumber(farmer.phone)}
                  </a>
                </p>
                {/* 주소 정보 */}
                <div className="space-y-1">
                  {farmer.zipCode && (
                    <p>
                      <span className="font-medium">우편번호:</span> {farmer.zipCode}
                    </p>
                  )}
                  {farmer.roadAddress && (
                    <p className="flex items-center">
                      <span className="font-medium mr-2">도로명:</span>
                      <a 
                        href={`https://map.kakao.com/link/search/${farmer.roadAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {farmer.roadAddress}
                      </a>
                    </p>
                  )}
                  {farmer.jibunAddress && (
                    <p className="flex items-center">
                      <span className="font-medium mr-2">지번:</span>
                      <a 
                        href={`https://map.kakao.com/link/search/${farmer.jibunAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {farmer.jibunAddress}
                      </a>
                    </p>
                  )}
                  {farmer.addressDetail && (
                    <p>
                      <span className="font-medium">상세주소:</span> {farmer.addressDetail}
                    </p>
                  )}
                </div>
                {farmer.businessName && (
                  <p>
                    <span className="font-medium">상호:</span> {farmer.businessName}
                  </p>
                )}

                {/* 우편수취가능여부 */}
                <p>
                  <span className="font-medium">우편수취:</span>
                  <span className={`ml-2 px-2 py-0.5 text-sm rounded ${
                    farmer.canReceiveMail ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {farmer.canReceiveMail ? '가능' : '불가능'}
                  </span>
                </p>

                {/* 영농형태 */}
                {farmer.farmingTypes && Object.entries(farmer.farmingTypes).some(([_, value]) => value) && (
                  <div>
                    <p className="font-medium">영농형태:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(farmer.farmingTypes)
                        .filter(([_, value]) => value)
                        .map(([key]) => {
                          // 축산업인 경우 세부 항목 표시
                          if (key === 'livestock' && Array.isArray(farmer.mainCrop?.livestockDetails) && farmer.mainCrop.livestockDetails.length > 0) {
                            const livestockLabels = {
                              cattle: '한우',
                              pig: '돼지',
                              chicken: '닭',
                              duck: '오리',
                              goat: '염소'
                            };
                            const details = farmer.mainCrop.livestockDetails
                              .map(type => livestockLabels[type as keyof typeof livestockLabels])
                              .join(', ');
                            return (
                              <span
                                key={key}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                              >
                                축산업 ({details})
                              </span>
                            );
                          }
                          return (
                            <span
                              key={key}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                            >
                              {key === 'waterPaddy' ? '수도작' :
                               key === 'fieldFarming' ? '밭농사' :
                               key === 'orchard' ? '과수원' :
                               key === 'forageCrop' ? '사료작물' : key}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 주작물 */}
                {farmer.mainCrop && Object.entries(farmer.mainCrop).some(([key, value]) => value && !key.endsWith('Details')) && (
                  <div>
                    <p className="font-medium">주작물:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(farmer.mainCrop)
                        .filter(([key, value]) => value && !key.endsWith('Details'))
                        .map(([key]) => {
                          // 각 주작물 유형별 세부 정보 표시
                          const detailsKey = `${key}Details` as keyof typeof farmer.mainCrop;
                          const details = farmer.mainCrop[detailsKey];
                          
                          // 각 주작물 유형별 라벨 정의
                          const labels: { [key: string]: { [key: string]: string } } = {
                            foodCrops: {
                              rice: '벼',
                              barley: '보리',
                              wheat: '밀',
                              corn: '옥수수',
                              potato: '감자',
                              soybean: '콩',
                              sweetPotato: '고구마'
                            },
                            facilityHort: {
                              tomato: '토마토',
                              strawberry: '딸기',
                              cucumber: '오이',
                              pepper: '고추',
                              watermelon: '수박',
                              melon: '멜론'
                            },
                            fieldVeg: {
                              cabbage: '배추',
                              radish: '무',
                              garlic: '마늘',
                              onion: '양파',
                              carrot: '당근'
                            },
                            fruits: {
                              apple: '사과',
                              pear: '배',
                              grape: '포도',
                              peach: '복숭아',
                              citrus: '감귤'
                            },
                            specialCrops: {
                              sesame: '참깨',
                              perilla: '들깨',
                              ginseng: '인삼',
                              medicinalHerbs: '약용작물'
                            },
                            flowers: {
                              rose: '장미',
                              chrysanthemum: '국화',
                              lily: '백합',
                              orchid: '난'
                            },
                            livestock: {
                              cattle: '한우',
                              pig: '돼지',
                              chicken: '닭',
                              duck: '오리',
                              goat: '염소'
                            }
                          };

                          // 세부 정보가 있는 경우 표시
                          if (Array.isArray(details) && details.length > 0 && labels[key]) {
                            const detailLabels = details
                              .map(item => labels[key][item as keyof typeof labels[typeof key]])
                              .filter(Boolean)
                              .join(', ');

                            return (
                              <span
                                key={key}
                                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded"
                              >
                                {key === 'foodCrops' ? '식량작물' :
                                 key === 'facilityHort' ? '시설원예' :
                                 key === 'fieldVeg' ? '노지채소' :
                                 key === 'fruits' ? '과수' :
                                 key === 'specialCrops' ? '특용작물' :
                                 key === 'flowers' ? '화훼' :
                                 key === 'livestock' ? '축산' : key}
                                {detailLabels && ` (${detailLabels})`}
                              </span>
                            );
                          }

                          // 세부 정보가 없는 경우 기본 표시
                          return (
                            <span
                              key={key}
                              className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded"
                            >
                              {key === 'foodCrops' ? '식량작물' :
                               key === 'facilityHort' ? '시설원예' :
                               key === 'fieldVeg' ? '노지채소' :
                               key === 'fruits' ? '과수' :
                               key === 'specialCrops' ? '특용작물' :
                               key === 'flowers' ? '화훼' :
                               key === 'livestock' ? '축산' : key}
                            </span>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 보유 농기계 */}
                {farmer.equipments && farmer.equipments.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="font-medium mb-2">보유 농기계</p>
                    <div className="space-y-1">
                      {farmer.equipments.map((equipment, index) => (
                        <div key={index} className="text-sm">
                          <span className="text-gray-600">
                            {equipment.type === 'tractor' ? '트랙터' :
                             equipment.type === 'combine' ? '콤바인' :
                             equipment.type === 'rice_transplanter' ? '이앙기' :
                             equipment.type === 'forklift' ? '지게차' :
                             equipment.type === 'excavator' ? '굴삭기' :
                             equipment.type === 'skid_loader' ? '스키로더' :
                             equipment.type === 'dryer' ? '건조기' :
                             equipment.type === 'silo' ? '싸일론' :
                             equipment.type === 'drone' ? '드론' :
                             equipment.type}
                          </span>
                          {equipment.manufacturer && (
                            <span className="text-gray-500">
                              {' - '}
                              {equipment.manufacturer}
                              {equipment.model && ` ${equipment.model}`}
                            </span>
                          )}
                          {equipment.tradeType && (
                            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                              equipment.tradeType === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {equipment.tradeType === 'sale' ? '판매' : '구매'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* 모달 */}
      {selectedFarmer && (
        <FarmerDetailModal
          farmer={selectedFarmer}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFarmer(null);
          }}
        />
      )}
    </div>
  );
}