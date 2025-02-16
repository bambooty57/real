'use client'

import React, { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, doc, deleteDoc, writeBatch } from 'firebase/firestore'
import { ref, deleteObject, listAll } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Link from 'next/link'
import { FaFileExcel } from 'react-icons/fa'
import { toast } from 'react-hot-toast'
import FarmerDetailModal from '@/components/FarmerDetailModal'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { useSearchFilter } from '@/contexts/SearchFilterContext'
import FarmerList from './components/FarmerList'
import FarmerFilter from './components/FarmerFilter'
import Pagination from './components/Pagination'
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer, cropDisplayNames } from '@/utils/displayNames'
import { BiRefresh } from 'react-icons/bi'
import { Farmer } from '@/types/farmer'

export default function FarmersClient() {
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
  const farmersPerPage = 15 // 페이지당 표시할 농민 수

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
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const fetchFarmers = async () => {
      try {
        const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const farmersData = (querySnapshot.docs?.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            phone: data.phone || '',
            businessName: data.businessName || '',
            roadAddress: data.roadAddress || '',
            jibunAddress: data.jibunAddress || '',
            zipCode: data.zipCode || '',
            addressDetail: data.addressDetail || '',
            canReceiveMail: data.canReceiveMail ?? false,
            ageGroup: data.ageGroup || '',
            farmingTypes: data.farmingTypes || {},
            mainCrop: data.mainCrop || {},
            memo: data.memo || '',
            rating: data.rating || 0,
            equipments: (data.equipments || []).map((eq: any) => ({
              id: eq.id || '',
              type: eq.type || '',
              manufacturer: eq.manufacturer || '',
              model: eq.model || '',
              condition: eq.condition || 0,
              saleType: eq.saleType || null,
              tradeType: eq.tradeType || '',
              desiredPrice: eq.desiredPrice || '',
              saleStatus: eq.saleStatus || 'available',
              memo: eq.memo || '',
              images: eq.images || [],
              attachments: (eq.attachments || []).map((att: any) => ({
                type: att.type || '',
                manufacturer: att.manufacturer || '',
                model: att.model || '',
                condition: att.condition || 0,
                memo: att.memo || '',
                images: att.images || []
              }))
            })),
            farmerImages: data.farmerImages || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
          } as Farmer;
        }) || []) as Farmer[];
        
        if (isMounted) {
          if (farmersData && farmersData.length > 0) {
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
              // 지번주소가 있는 경우 우선 사용
              const address = farmer.jibunAddress;
              if (!address?.startsWith('전라남도')) return;

              // 영암군 주소 디버깅
              if (address.includes('영암군')) {
                console.log('영암군 주소:', address);
                console.log('주소 파트:', address.split(' '));
              }

              const parts = address.split(' ');
              if (parts.length < 3) return;

              const city = parts[1];     // 시/군

              // 읍/면/동 추출 - "읍", "면", "동"으로 끝나는 부분 찾기
              const district = parts.find((part, index) => 
                index > 1 && (part.endsWith('읍') || part.endsWith('면') || part.endsWith('동'))
              );

              // 영암군 district 디버깅
              if (city === '영암군') {
                console.log('영암군 district:', district);
              }

              // 리(里) 추출 - district 이후의 "리"로 끝나는 부분 찾기
              const districtIndex = district ? parts.indexOf(district) : -1;
              const village = districtIndex > -1 ? parts.find((part, index) => 
                index > districtIndex && part.endsWith('리')
              ) : null;

              // 영암군 village 디버깅
              if (city === '영암군') {
                console.log('영암군 village:', village);
              }

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
          } else {
            setFarmers([]);
            setAvailableCities(new Set());
            setDistrictsByCity(new Map());
            setVillagesByDistrict(new Map());
          }
        }
      } catch (error) {
        console.error('Error fetching farmers:', error);
        if (isMounted) {
          toast.error('데이터 로딩 중 오류가 발생했습니다.');
          setFarmers([]);
          setAvailableCities(new Set());
          setDistrictsByCity(new Map());
          setVillagesByDistrict(new Map());
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFarmers();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 필터링 로직
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
      // 리 검색 시에는 지번주소만 사용
      const address = filterState.selectedVillage ? farmer.jibunAddress : (farmer.jibunAddress || farmer.roadAddress);
      if (!address) return false;

      if (filterState.selectedCity && !address.includes(filterState.selectedCity)) return false;
      if (filterState.selectedDistrict && !address.includes(filterState.selectedDistrict)) return false;
      if (filterState.selectedVillage && !address.includes(filterState.selectedVillage)) return false;
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
  const totalPages = Math.max(1, Math.ceil(filteredFarmers.length / farmersPerPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const safeIndexOfLastFarmer = safeCurrentPage * farmersPerPage
  const safeIndexOfFirstFarmer = safeIndexOfLastFarmer - farmersPerPage
  const currentFarmers = filteredFarmers.slice(safeIndexOfFirstFarmer, safeIndexOfLastFarmer)

  // 농민 이미지 삭제 함수
  const deleteFarmerImages = async (farmerId: string) => {
    try {
      const farmerImagesRef = ref(storage, `farmers/${farmerId}`)
      const filesList = await listAll(farmerImagesRef)
      const deletePromises = filesList.items.map(item => deleteObject(item))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Error deleting farmer images:', error)
      throw error
    }
  }

  // 단일 농민 삭제 핸들러
  const handleDelete = async (farmerId: string) => {
    if (window.confirm('정말로 이 농민의 정보를 삭제하시겠습니까?')) {
      try {
        await deleteFarmerImages(farmerId)
        await deleteDoc(doc(db, 'farmers', farmerId))
        setFarmers(prev => prev.filter(farmer => farmer.id !== farmerId))
        toast.success('삭제되었습니다.')
      } catch (error) {
        console.error('Error deleting farmer:', error)
        toast.error('삭제 중 오류가 발생했습니다.')
      }
    }
  }

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const q = query(collection(db, 'farmers'), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[]
      setFarmers(farmersData)
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
      })
      setSelectedFarmers([])
      toast.success('목록이 새로고침되었습니다.')
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('데이터 새로고침 중 오류가 발생했습니다.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // 전체 선택 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFarmers(currentFarmers.map(farmer => farmer.id))
    } else {
      setSelectedFarmers([])
    }
  }

  // 개별 선택 핸들러
  const handleSelectFarmer = (farmerId: string, checked: boolean) => {
    if (checked) {
      setSelectedFarmers(prev => [...prev, farmerId])
    } else {
      setSelectedFarmers(prev => prev.filter(id => id !== farmerId))
    }
  }

  // 선택된 농민 삭제 핸들러
  const handleDeleteSelected = async () => {
    if (!selectedFarmers.length) {
      toast.error('선택된 농민이 없습니다.')
      return
    }

    if (window.confirm(`선택한 ${selectedFarmers.length}명의 농민 정보를 삭제하시겠습니까?`)) {
      try {
        const batch = writeBatch(db)
        const deletePromises = selectedFarmers.map(async (farmerId) => {
          await deleteFarmerImages(farmerId)
          batch.delete(doc(db, 'farmers', farmerId))
        })

        await Promise.all(deletePromises)
        await batch.commit()

        setFarmers(prev => prev.filter(farmer => !selectedFarmers.includes(farmer.id)))
        setSelectedFarmers([])
        toast.success('선택한 농민들이 삭제되었습니다.')
      } catch (error) {
        console.error('Error deleting selected farmers:', error)
        toast.error('삭제 중 오류가 발생했습니다.')
      }
    }
  }

  // 전체 삭제 핸들러
  const handleDeleteAll = async () => {
    if (!farmers.length) {
      toast.error('삭제할 농민이 없습니다.')
      return
    }

    if (window.confirm('모든 농민의 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const batch = writeBatch(db)
        const deletePromises = farmers.map(async (farmer) => {
          await deleteFarmerImages(farmer.id)
          batch.delete(doc(db, 'farmers', farmer.id))
        })

        await Promise.all(deletePromises)
        await batch.commit()

        setFarmers([])
        setSelectedFarmers([])
        toast.success('모든 농민이 삭제되었습니다.')
      } catch (error) {
        console.error('Error deleting all farmers:', error)
        toast.error('삭제 중 오류가 발생했습니다.')
      }
    }
  }

  // 엑셀 내보내기 핸들러
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('농민 목록')

      // 헤더 설정
      worksheet.columns = [
        { header: '이름', key: 'name', width: 10 },
        { header: '전화번호', key: 'phone', width: 15 },
        { header: '상호명', key: 'businessName', width: 20 },
        { header: '도로명주소', key: 'roadAddress', width: 40 },
        { header: '지번주소', key: 'jibunAddress', width: 40 },
        { header: '상세주소', key: 'addressDetail', width: 20 },
        { header: '우편번호', key: 'zipCode', width: 10 },
        { header: '우편수취여부', key: 'canReceiveMail', width: 12 },
        { header: '연령대', key: 'ageGroup', width: 10 },
        { header: '영농형태', key: 'farmingTypes', width: 30 },
        { header: '주작물', key: 'mainCrop', width: 30 },
        { header: '메모', key: 'memo', width: 40 },
        { header: '등록일', key: 'createdAt', width: 20 },
        { header: '수정일', key: 'updatedAt', width: 20 }
      ]

      // 데이터 포맷팅 헬퍼 함수
      const safeGet = (obj: any, path: string, defaultValue: any = '') => {
        return path.split('.').reduce((acc, part) => {
          if (acc === null || acc === undefined) return defaultValue
          return acc[part]
        }, obj) || defaultValue
      }

      // 타임스탬프 포맷팅 함수
      const formatTimestamp = (timestamp: any) => {
        if (!timestamp) return ''
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      // 데이터 추가
      filteredFarmers.forEach(farmer => {
        // 영농형태 문자열 변환
        const farmingTypesStr = farmer.farmingTypes
          ? Object.entries(farmer.farmingTypes)
              .filter(([_, value]) => value)
              .map(([type]) => getFarmingTypeDisplay(type))
              .join(', ')
          : ''

        // 주작물 문자열 변환
        const mainCropStr = farmer.mainCrop
          ? Object.entries(farmer.mainCrop)
              .filter(([key, value]) => value && !key.endsWith('Details'))
              .map(([type]) => {
                const detailsKey = `${type}Details` as keyof typeof farmer.mainCrop
                const details = farmer.mainCrop?.[detailsKey]
                const mainType = getMainCropDisplay(type)
                if (Array.isArray(details) && details.length > 0) {
                  const detailsStr = details
                    .map(detail => cropDisplayNames[detail] || detail)
                    .join(', ')
                  return `${mainType}(${detailsStr})`
                }
                return mainType
              })
              .join(', ')
          : ''

        worksheet.addRow({
          name: farmer.name,
          phone: farmer.phone,
          businessName: farmer.businessName || '',
          roadAddress: farmer.roadAddress || '',
          jibunAddress: farmer.jibunAddress || '',
          addressDetail: farmer.addressDetail || '',
          zipCode: farmer.zipCode || '',
          canReceiveMail: farmer.canReceiveMail ? '가능' : '불가능',
          ageGroup: farmer.ageGroup || '',
          farmingTypes: farmingTypesStr,
          mainCrop: mainCropStr,
          memo: farmer.memo || '',
          createdAt: formatTimestamp(farmer.createdAt),
          updatedAt: formatTimestamp(farmer.updatedAt)
        })
      })

      // 스타일 적용
      worksheet.getRow(1).font = { bold: true }
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

      // 엑셀 파일 생성 및 다운로드
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      saveAs(blob, '농민목록.xlsx')

      toast.success('엑셀 파일이 생성되었습니다.')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('엑셀 파일 생성 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">농민 목록</h1>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isRefreshing}
            >
              <BiRefresh className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <Link
              href="/farmers/new"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              농민 등록
            </Link>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
            >
              <FaFileExcel className="w-5 h-5" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        <FarmerFilter
          availableCities={availableCities}
          districtsByCity={districtsByCity}
          villagesByDistrict={villagesByDistrict}
          updateQueryParams={updateQueryParams}
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                총 {filteredFarmers.length}명의 농민이 있습니다.
              </span>
              {selectedFarmers.length > 0 && (
                <span className="text-blue-600">
                  {selectedFarmers.length}명 선택됨
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteSelected}
                className={`px-4 py-2 text-white rounded ${
                  selectedFarmers.length > 0
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                disabled={selectedFarmers.length === 0}
              >
                선택 삭제
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                전체 삭제
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        ) : filteredFarmers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            농민 정보가 없습니다.
          </div>
        ) : (
          <>
            <FarmerList
              farmers={currentFarmers}
              selectedFarmers={selectedFarmers}
              onSelectAll={handleSelectAll}
              onSelectFarmer={handleSelectFarmer}
              onDelete={handleDelete}
              onView={(farmer) => {
                setSelectedFarmer(farmer)
                setIsModalOpen(true)
              }}
            />
            <div className="p-4 border-t">
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      <FarmerDetailModal
        farmer={selectedFarmer}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedFarmer(null)
        }}
      />
    </div>
  )
} 