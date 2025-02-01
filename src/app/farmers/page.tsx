'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Link from 'next/link';
import { Farmer } from '@/types/farmer';
import { BiRefresh } from 'react-icons/bi';
import { FaFileExcel } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import FarmerDetailModal from '@/components/FarmerDetailModal';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useSearchFilter } from '@/contexts/SearchFilterContext';
import FarmerList from './components/FarmerList';
import FarmerFilter from './components/FarmerFilter';
import Pagination from './components/Pagination';

export default function FarmersPage() {
  const { filterState, setFilterState } = useSearchFilter();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<Set<string>>(new Set());
  const [districtsByCity, setDistrictsByCity] = useState<Map<string, Set<string>>>(new Map());
  const [villagesByDistrict, setVillagesByDistrict] = useState<Map<string, Set<string>>>(new Map());
  const farmersPerPage = 15;  // 페이지당 표시할 농민 수

  // URL 쿼리 파라미터 관리 함수
  const updateQueryParams = (params: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  };

  // 초기 필터 상태 설정
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    
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
    };

    setFilterState(initialFilters);
  }, []);

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

  // 필터링 로직
  const filteredFarmers = farmers.filter(farmer => {
    // 1. 검색어 필터
    if (filterState.searchTerm) {
      const searchLower = filterState.searchTerm.toLowerCase();
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
    if (filterState.selectedCity || filterState.selectedDistrict || filterState.selectedVillage) {
      const address = farmer.jibunAddress || farmer.roadAddress;
      if (!address) return false;

      if (filterState.selectedCity && !address.includes(filterState.selectedCity)) return false;
      if (filterState.selectedDistrict && !address.includes(filterState.selectedDistrict)) return false;
      if (filterState.selectedVillage && !address.includes(filterState.selectedVillage)) return false;
    }

    // 3. 영농형태 필터
    if (filterState.selectedFarmingType && (!farmer.farmingTypes || !farmer.farmingTypes[filterState.selectedFarmingType as keyof typeof farmer.farmingTypes])) {
      return false;
    }

    // 4. 우편수취여부 필터
    if (filterState.selectedMailOption !== 'all') {
      if (filterState.selectedMailOption === 'yes' && !farmer.canReceiveMail) return false;
      if (filterState.selectedMailOption === 'no' && farmer.canReceiveMail) return false;
    }

    // 5. 판매유형 필터
    if (filterState.selectedSaleType !== 'all') {
      if (!farmer.equipments?.some(eq => eq?.saleType === filterState.selectedSaleType)) {
        return false;
      }
    }

    // 6. 농기계 종류 필터
    if (filterState.selectedEquipmentType) {
      if (!farmer.equipments?.some(eq => eq?.type === filterState.selectedEquipmentType)) {
        return false;
      }
    }

    // 7. 제조사 필터
    if (filterState.selectedManufacturer) {
      if (!farmer.equipments?.some(eq => eq?.manufacturer === filterState.selectedManufacturer)) {
        return false;
      }
    }

    return true;
  });

  // 페이지네이션 로직
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const safeIndexOfLastFarmer = safeCurrentPage * farmersPerPage;
  const safeIndexOfFirstFarmer = safeIndexOfLastFarmer - farmersPerPage;
  const currentFarmers = filteredFarmers.slice(safeIndexOfFirstFarmer, safeIndexOfLastFarmer);

  // 농민 이미지 삭제 함수
  const deleteFarmerImages = async (farmerId: string) => {
    try {
      const farmerImagesRef = ref(storage, `farmers/${farmerId}`);
      const filesList = await listAll(farmerImagesRef);
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
        await deleteFarmerImages(farmerId);
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
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: '이름', key: 'name', width: 15 },
      { header: '전화번호', key: 'phone', width: 15 },
      { header: '상호', key: 'businessName', width: 20 },
      { header: '영농형태', key: 'farmingTypes', width: 15 },
      { header: '주작물', key: 'mainCrop', width: 15 },
      { header: '우편번호', key: 'zipCode', width: 10 },
      { header: '도로명주소', key: 'roadAddress', width: 40 },
      { header: '지번주소', key: 'jibunAddress', width: 40 },
      { header: '상세주소', key: 'addressDetail', width: 30 },
      { header: '메모', key: 'memo', width: 30 },
      { header: '연령대', key: 'ageGroup', width: 10 },
      { header: '우편수취가능여부', key: 'canReceiveMail', width: 15 },
      { header: '보유농기계', key: 'equipments', width: 30 },
      { header: '생성일', key: 'createdAt', width: 20 },
      { header: '수정일', key: 'updatedAt', width: 20 }
    ];

    // 선택된 농민들의 데이터 추가
    const farmersToExport = selectedFarmers.length > 0 
      ? farmers.filter(farmer => selectedFarmers.includes(farmer.id))
      : filteredFarmers;

    farmersToExport.forEach(farmer => {
      worksheet.addRow({
        id: farmer.id || '',
        name: farmer.name || '',
        phone: farmer.phone || '',
        businessName: farmer.businessName || '',
        farmingTypes: Object.entries(farmer.farmingTypes || {})
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', '),
        mainCrop: Object.entries(farmer.mainCrop || {})
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', '),
        zipCode: farmer.zipCode || '',
        roadAddress: farmer.roadAddress || '',
        jibunAddress: farmer.jibunAddress || '',
        addressDetail: farmer.addressDetail || '',
        memo: farmer.memo || '',
        ageGroup: farmer.ageGroup || '',
        canReceiveMail: farmer.canReceiveMail ? '가능' : '불가능',
        equipments: (farmer.equipments || [])
          .map(eq => `${eq.type || ''}(${eq.manufacturer || ''})`)
          .filter(Boolean)
          .join('; '),
        createdAt: farmer.createdAt ? new Date(farmer.createdAt).toLocaleString('ko-KR') : '',
        updatedAt: farmer.updatedAt ? new Date(farmer.updatedAt).toLocaleString('ko-KR') : ''
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
    <div className="farmers-list-page">
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

        <FarmerFilter
          availableCities={availableCities}
          districtsByCity={districtsByCity}
          villagesByDistrict={villagesByDistrict}
          onUpdateQueryParams={updateQueryParams}
        />

        <FarmerList
          farmers={currentFarmers}
          onSelect={handleSelectFarmer}
          selectedFarmers={selectedFarmers}
          onViewDetail={(farmer) => {
            setSelectedFarmer(farmer);
            setIsModalOpen(true);
          }}
        />

        {filteredFarmers.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredFarmers.length}
            itemsPerPage={farmersPerPage}
            startIndex={safeIndexOfFirstFarmer}
            endIndex={safeIndexOfLastFarmer}
          />
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
    </div>
  );
}