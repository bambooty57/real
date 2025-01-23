'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'

interface Equipment {
  type: string
  manufacturer: string
  model: string
  year: string
  usageHours: string
  rating: string
  forSale?: boolean
  forPurchase?: boolean
  desiredPrice?: string
  purchasePrice?: string
  saleStatus?: string
  purchaseStatus?: string
  saleDate?: string
  purchaseDate?: string
}

interface Farmer {
  id: string
  name: string
  phone: string
  equipments: Equipment[]
}

export default function TradePage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tradeType: 'all', // 'all', 'sale', 'purchase'
    status: 'all', // 'all', '판매가능', '예약중', '판매완료'
    equipmentType: '',
    manufacturer: ''
  })

  // 농기계 종류 매핑
  const equipmentTypeMap = {
    '트랙터': 'tractor',
    '콤바인': 'combine',
    '이앙기': 'rice_transplanter',
    '지게차': 'forklift',
    '굴삭기': 'excavator',
    '스키로더': 'skid_loader'
  };

  // 제조사 매핑 추가
  const manufacturerMap = {
    '대동': 'daedong',
    '국제': 'kukje',
    '엘에스': 'ls',
    '얀마': 'yanmar',
    '구보다': 'kubota',
    '존디어': 'john_deere',
    '뉴홀랜드': 'new_holland',
    '엠에프': 'mf',
    '케이스': 'case',
    '현대': 'hyundai',
    '삼성': 'samsung',
    '볼보': 'volvo',
    '히타치': 'hitachi',
    '두산': 'doosan'
  };

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    try {
      const farmersRef = collection(db, 'farmers')
      const querySnapshot = await getDocs(farmersRef)
      
      // 제조사 목록 수집
      const manufacturers = new Set();
      
      const farmersData = querySnapshot.docs
        .map(doc => {
          const data = { id: doc.id, ...doc.data() } as Farmer;
          // 제조사 정보 수집
          data.equipments?.forEach(eq => {
            if (eq.manufacturer) {
              manufacturers.add(eq.manufacturer);
            }
          });
          return data;
        })
        .filter(farmer => farmer.equipments?.some(eq => eq.forSale || eq.forPurchase))
      
      console.log('\n=== 제조사 목록 ===\n');
      console.log(Array.from(manufacturers).sort());
      console.log('\n=== Filtered farmers data ===\n', farmersData);
      
      setFarmers(farmersData)
    } catch (error) {
      console.error('Error fetching farmers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFarmers = (farmer: Farmer) => {
    return farmer.equipments?.some(equipment => {
      // 거래 유형 필터
      if (filters.tradeType === 'sale' && !equipment.forSale) return false
      if (filters.tradeType === 'purchase' && !equipment.forPurchase) return false
      if (filters.tradeType === 'all' && !equipment.forSale && !equipment.forPurchase) return false

      // 거래 상태 필터 개선
      if (filters.status !== 'all') {
        console.log('Status Filter:', {
          status: filters.status,
          tradeType: filters.tradeType,
          equipment: {
            saleStatus: equipment.saleStatus,
            purchaseStatus: equipment.purchaseStatus,
            forSale: equipment.forSale,
            forPurchase: equipment.forPurchase
          }
        });
        
        if (filters.tradeType === 'sale') {
          if (!equipment.saleStatus || equipment.saleStatus !== filters.status) return false
        } else if (filters.tradeType === 'purchase') {
          if (!equipment.purchaseStatus || equipment.purchaseStatus !== filters.status) return false
        } else {
          const saleMatches = equipment.saleStatus === filters.status
          const purchaseMatches = equipment.purchaseStatus === filters.status
          if (!saleMatches && !purchaseMatches) return false
        }
      }

      // 농기계 종류 필터
      if (filters.equipmentType) {
        const dbEquipmentType = equipmentTypeMap[filters.equipmentType];
        console.log('Equipment Type Filter:', {
          filterType: filters.equipmentType,
          dbEquipmentType: dbEquipmentType,
          equipmentType: equipment.type,
          equipment: equipment
        });
        if (equipment.type !== dbEquipmentType) return false;
      }

      // 제조사 필터
      if (filters.manufacturer) {
        const dbManufacturer = manufacturerMap[filters.manufacturer];
        console.log('Manufacturer Filter:', {
          filterManufacturer: filters.manufacturer,
          dbManufacturer: dbManufacturer,
          equipmentManufacturer: equipment.manufacturer,
          equipment: equipment
        });
        if (equipment.manufacturer !== dbManufacturer) return false;
      }

      return true
    }) || false
  }

  const filteredFarmers = farmers.filter(filterFarmers)

  if (loading) return <div className="p-8">로딩중...</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농기계 거래 관리</h1>

      {/* 필터 섹션 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">검색 필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2">거래 유형</label>
            <select
              value={filters.tradeType}
              onChange={(e) => setFilters({...filters, tradeType: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="sale">판매</option>
              <option value="purchase">구매</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">거래 상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="all">전체</option>
              <option value="판매가능">판매가능</option>
              <option value="예약중">예약중</option>
              <option value="판매완료">판매완료</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">농기계 종류</label>
            <select
              value={filters.equipmentType}
              onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="트랙터">트랙터</option>
              <option value="콤바인">콤바인</option>
              <option value="이앙기">이앙기</option>
              <option value="지게차">지게차</option>
              <option value="굴삭기">굴삭기</option>
              <option value="스키로더">스키로더</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">제조사</label>
            <select
              value={filters.manufacturer}
              onChange={(e) => setFilters({...filters, manufacturer: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="daedong">대동</option>
              <option value="kukje">국제</option>
              <option value="ls">LS</option>
              <option value="dongyang">동양</option>
              <option value="asia">아세아</option>
              <option value="yanmar">얀마</option>
              <option value="iseki">이세키</option>
              <option value="john_deere">존디어</option>
              <option value="kubota">구보다</option>
              <option value="fendt">펜트</option>
              <option value="case">케이스</option>
              <option value="new_holland">뉴홀랜드</option>
              <option value="mf">MF</option>
              <option value="kumsung">금성</option>
              <option value="fiat">피아트</option>
              <option value="hyundai">현대</option>
              <option value="doosan">두산</option>
              <option value="volvo">볼보</option>
              <option value="samsung">삼성</option>
              <option value="daewoo">대우</option>
              <option value="hitachi">히타치</option>
              <option value="claas">클라스</option>
            </select>
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">검색 결과 ({filteredFarmers.length}건)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map((farmer) => {
            const targetEquipment = farmer.equipments?.find(eq => eq.forSale || eq.forPurchase);
            const equipmentType = Object.entries(equipmentTypeMap).find(([_, value]) => value === targetEquipment?.type)?.[0] || targetEquipment?.type;
            
            return (
            <div key={farmer.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{farmer.name}</h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {farmer.equipments?.some(eq => eq.forSale) ? '판매' : '구매'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">연락처:</span> {farmer.phone}
                </p>
                <p>
                  <span className="font-medium">농기계:</span> {equipmentType} {targetEquipment?.model}
                </p>
                <p>
                  <span className="font-medium">연식:</span> {targetEquipment?.year}
                </p>
                <p>
                  <span className="font-medium">사용시간:</span> {targetEquipment?.usageHours}시간
                </p>
                <p>
                  <span className="font-medium">상태:</span> {targetEquipment?.rating}점
                </p>
                {farmer.equipments?.find(eq => eq.forSale) && (
                  <>
                    <p>
                      <span className="font-medium">판매가:</span> {Number(farmer.equipments?.find(eq => eq.forSale)?.desiredPrice || 0).toLocaleString()}만원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {farmer.equipments?.find(eq => eq.forSale)?.saleStatus || '상담 전'}
                    </p>
                  </>
                )}
                {farmer.equipments?.find(eq => eq.forPurchase) && (
                  <>
                    <p>
                      <span className="font-medium">구매희망가:</span> {Number(farmer.equipments?.find(eq => eq.forPurchase)?.purchasePrice || 0).toLocaleString()}만원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {farmer.equipments?.find(eq => eq.forPurchase)?.purchaseStatus || '상담 전'}
                    </p>
                  </>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href={`/farmers/${farmer.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  상세보기 →
                </Link>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
} 