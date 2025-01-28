'use client';

import React from 'react';
import { useSearchFilter } from '@/contexts/SearchFilterContext';

interface FarmerFilterProps {
  availableCities: Set<string>;
  districtsByCity: Map<string, Set<string>>;
  villagesByDistrict: Map<string, Set<string>>;
  onUpdateQueryParams: (params: Record<string, string>) => void;
}

export default function FarmerFilter({
  availableCities,
  districtsByCity,
  villagesByDistrict,
  onUpdateQueryParams
}: FarmerFilterProps) {
  const { filterState, setFilterState } = useSearchFilter();

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
    const city = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedCity: city,
      selectedDistrict: '',
      selectedVillage: ''
    }));
    onUpdateQueryParams({ city, district: '', village: '' });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const district = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedDistrict: district,
      selectedVillage: ''
    }));
    onUpdateQueryParams({ district, village: '' });
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const village = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedVillage: village
    }));
    onUpdateQueryParams({ village });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search = e.target.value;
    setFilterState(prev => ({
      ...prev,
      searchTerm: search
    }));
    onUpdateQueryParams({ search });
  };

  const handleFarmingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const farmingType = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedFarmingType: farmingType
    }));
    onUpdateQueryParams({ farmingType });
  };

  const handleMailOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mailOption = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedMailOption: mailOption
    }));
    onUpdateQueryParams({ mailOption });
  };

  const handleSaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const saleType = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedSaleType: saleType
    }));
    onUpdateQueryParams({ saleType });
  };

  const handleEquipmentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const equipmentType = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedEquipmentType: equipmentType
    }));
    onUpdateQueryParams({ equipmentType });
  };

  const handleManufacturerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const manufacturer = e.target.value;
    setFilterState(prev => ({
      ...prev,
      selectedManufacturer: manufacturer
    }));
    onUpdateQueryParams({ manufacturer });
  };

  return (
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
  );
} 