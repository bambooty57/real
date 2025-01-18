'use client'

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'

interface Farmer {
  id: string
  name: string
  address: string
  phone: string
  ageGroup: string
  mainCrop: string
  equipment: {
    type: string
    manufacturer: string
  }
}

export default function FarmerList() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState({
    ageGroup: '',
    equipmentType: '',
    manufacturer: ''
  })

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'farmers'))
        const farmerList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Farmer[]
        setFarmers(farmerList)
      } catch (error) {
        console.error('Error fetching farmers:', error)
        alert('농민 목록을 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmers()
  }, [])

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = 
      farmer.name.includes(searchTerm) ||
      farmer.address.includes(searchTerm) ||
      farmer.phone.includes(searchTerm) ||
      farmer.mainCrop.includes(searchTerm)

    const matchesAge = !filter.ageGroup || farmer.ageGroup === filter.ageGroup
    const matchesEquipment = !filter.equipmentType || farmer.equipment?.type === filter.equipmentType
    const matchesManufacturer = !filter.manufacturer || farmer.equipment?.manufacturer === filter.manufacturer

    return matchesSearch && matchesAge && matchesEquipment && matchesManufacturer
  })

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
    </div>
  )

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">농민 목록</h1>
        <Link 
          href="/farmers/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          새 농민 등록
        </Link>
      </div>

      <div className="mb-6 space-y-4">
        <input
          type="text"
          placeholder="이름, 주소, 전화번호, 농작물로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filter.ageGroup}
            onChange={(e) => setFilter(prev => ({ ...prev, ageGroup: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">연령대 전체</option>
            {['30대', '40대', '50대', '60대', '70대'].map(age => (
              <option key={age} value={age}>{age}</option>
            ))}
          </select>

          <select
            value={filter.equipmentType}
            onChange={(e) => setFilter(prev => ({ ...prev, equipmentType: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">농기계 종류 전체</option>
            {['트랙터', '이앙기', '콤바인', '지게차', '굴삭기', '스키로더'].map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filter.manufacturer}
            onChange={(e) => setFilter(prev => ({ ...prev, manufacturer: e.target.value }))}
            className="p-2 border rounded"
          >
            <option value="">제조사 전체</option>
            {['대동', '국제', '엘에스', '얀마', '구보다', '존디어', '뉴홀랜드'].map(manufacturer => (
              <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredFarmers.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            검색 결과가 없습니다.
          </div>
        ) : (
          filteredFarmers.map((farmer) => (
            <Link 
              href={`/farmers/${farmer.id}`}
              key={farmer.id}
              className="block p-4 border rounded hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-bold text-lg">{farmer.name}</h2>
                  <p className="text-gray-600">{farmer.address}</p>
                  <p className="text-gray-600">{farmer.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{farmer.ageGroup}</p>
                  <p className="text-sm text-gray-500">{farmer.mainCrop}</p>
                  {farmer.equipment && (
                    <p className="text-sm text-gray-500">
                      {farmer.equipment.type} ({farmer.equipment.manufacturer})
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
} 