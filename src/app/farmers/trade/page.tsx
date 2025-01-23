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
  forSale: boolean
  desiredPrice: string
  saleStatus: string
  saleDate: string
  forPurchase: boolean
  purchasePrice: string
  purchaseStatus: string
  purchaseDate: string
}

interface Farmer {
  id: string
  name: string
  phone: string
  equipment: Equipment
}

export default function TradePage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    tradeType: 'all', // 'all', 'sale', 'purchase'
    status: 'all', // 'all', '상담중', '계약진행', '계약완료'
    equipmentType: '',
    manufacturer: '',
    minPrice: '',
    maxPrice: '',
  })

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    try {
      const farmersRef = collection(db, 'farmers')
      const querySnapshot = await getDocs(farmersRef)
      const farmersData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Farmer))
        .filter(farmer => farmer.equipment && (farmer.equipment.forSale || farmer.equipment.forPurchase))
      setFarmers(farmersData)
    } catch (error) {
      console.error('Error fetching farmers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFarmers = (farmer: Farmer) => {
    // 거래 유형 필터
    if (filters.tradeType === 'sale' && !farmer.equipment.forSale) return false
    if (filters.tradeType === 'purchase' && !farmer.equipment.forPurchase) return false

    // 거래 상태 필터
    if (filters.status !== 'all') {
      if (filters.tradeType === 'sale' && farmer.equipment.saleStatus !== filters.status) return false
      if (filters.tradeType === 'purchase' && farmer.equipment.purchaseStatus !== filters.status) return false
    }

    // 농기계 종류 필터
    if (filters.equipmentType && farmer.equipment.type !== filters.equipmentType) return false

    // 제조사 필터
    if (filters.manufacturer && farmer.equipment.manufacturer !== filters.manufacturer) return false

    // 가격 범위 필터
    const price = filters.tradeType === 'sale' 
      ? Number(farmer.equipment.desiredPrice.replace(/,/g, ''))
      : Number(farmer.equipment.purchasePrice.replace(/,/g, ''))
    
    if (filters.minPrice && price < Number(filters.minPrice)) return false
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false

    return true
  }

  const filteredFarmers = farmers.filter(filterFarmers)

  if (loading) return <div className="p-8">로딩중...</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농기계 거래 관리</h1>

      {/* 필터 섹션 */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">검색 필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value="상담중">상담중</option>
              <option value="계약진행">계약진행</option>
              <option value="계약완료">계약완료</option>
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
              <option value="대동">대동</option>
              <option value="국제">국제</option>
              <option value="엘에스">엘에스</option>
              <option value="얀마">얀마</option>
              <option value="구보다">구보다</option>
              <option value="존디어">존디어</option>
              <option value="뉴홀랜드">뉴홀랜드</option>
              <option value="엠에프">엠에프</option>
              <option value="케이스">케이스</option>
              <option value="현대">현대</option>
              <option value="삼성">삼성</option>
              <option value="볼보">볼보</option>
              <option value="히타치">히타치</option>
              <option value="두산">두산</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">최소 가격</label>
            <input
              type="text"
              value={filters.minPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setFilters({...filters, minPrice: value});
              }}
              className="w-full p-2 border rounded"
              placeholder="최소 가격"
            />
          </div>

          <div>
            <label className="block mb-2">최대 가격</label>
            <input
              type="text"
              value={filters.maxPrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setFilters({...filters, maxPrice: value});
              }}
              className="w-full p-2 border rounded"
              placeholder="최대 가격"
            />
          </div>
        </div>
      </div>

      {/* 결과 목록 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">검색 결과 ({filteredFarmers.length}건)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFarmers.map((farmer) => (
            <div key={farmer.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{farmer.name}</h3>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {farmer.equipment.forSale ? '판매' : '구매'}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">연락처:</span> {farmer.phone}
                </p>
                <p>
                  <span className="font-medium">농기계:</span> {farmer.equipment.manufacturer} {farmer.equipment.model}
                </p>
                <p>
                  <span className="font-medium">연식:</span> {farmer.equipment.year}
                </p>
                <p>
                  <span className="font-medium">사용시간:</span> {farmer.equipment.usageHours}시간
                </p>
                <p>
                  <span className="font-medium">상태:</span> {farmer.equipment.rating}점
                </p>
                {farmer.equipment.forSale && (
                  <>
                    <p>
                      <span className="font-medium">판매가:</span> {farmer.equipment.desiredPrice}원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {farmer.equipment.saleStatus || '상담 전'}
                    </p>
                  </>
                )}
                {farmer.equipment.forPurchase && (
                  <>
                    <p>
                      <span className="font-medium">구매희망가:</span> {farmer.equipment.purchasePrice}원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {farmer.equipment.purchaseStatus || '상담 전'}
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
          ))}
        </div>
      </div>
    </div>
  )
} 