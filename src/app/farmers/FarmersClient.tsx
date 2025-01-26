'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore'
import { ref, deleteObject, listAll } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Link from 'next/link'
import { FaFileExcel } from 'react-icons/fa'
import * as XLSX from 'xlsx-js-style'
import { Farmer } from '@/types/farmer'
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings'

interface AddressData {
  읍면동: string[];
  읍면: string[];
  동리: string[];
  시군구: string[];
  시도: string[];
}

const displayNames = {
  읍면동: '읍/면/동',
  읍면: '읍/면',
  동리: '동/리',
  시군구: '시/군/구',
  시도: '시/도'
} as const;

interface RegionData {
  읍면동?: string[] | { [key: string]: string[] };
  읍면?: { [key: string]: string[] } | string[];
}

interface JeonnamRegions {
  [city: string]: RegionData;
}

export default function FarmersClient() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [filteredFarmers, setFilteredFarmers] = useState<Farmer[]>([])
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFarmers()
  }, [])

  const fetchFarmers = async () => {
    try {
      const farmersRef = collection(db, 'farmers')
      const querySnapshot = await getDocs(farmersRef)
      const farmersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Farmer[]
      setFarmers(farmersData)
      setFilteredFarmers(farmersData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching farmers:', error)
      setLoading(false)
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedFarmers(filteredFarmers.map(farmer => farmer.id))
    } else {
      setSelectedFarmers([])
    }
  }

  const handleSelectFarmer = (id: string) => {
    setSelectedFarmers(prev => {
      if (prev.includes(id)) {
        return prev.filter(farmerId => farmerId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleBulkDelete = async () => {
    if (!window.confirm('선택한 농민들을 삭제하시겠습니까?')) return

    try {
      for (const id of selectedFarmers) {
        await handleDelete(null as any, id)
      }
      setSelectedFarmers([])
      await fetchFarmers()
    } catch (error) {
      console.error('Error deleting farmers:', error)
      alert('농민 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (e: React.MouseEvent | null, id: string) => {
    if (e) {
      e.preventDefault()
      if (!window.confirm('이 농민을 삭제하시겠습니까?')) return
    }

    try {
      // Delete farmer document
      await deleteDoc(doc(db, 'farmers', id))

      // Delete associated images from storage
      const imagesRef = ref(storage, `farmers/${id}`)
      try {
        const result = await listAll(imagesRef)
        await Promise.all(result.items.map(itemRef => deleteObject(itemRef)))
      } catch (error) {
        console.error('Error deleting images:', error)
      }

      if (!e) return // If called from bulk delete, don't refresh list

      await fetchFarmers()
      alert('농민이 삭제되었습니다.')
    } catch (error) {
      console.error('Error:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">농민 목록</h1>
          <span className="text-gray-600">
            검색 {filteredFarmers.length}명 / 총 {farmers.length}명
          </span>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedFarmers.length === filteredFarmers.length && filteredFarmers.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4"
            />
            <span>전체 선택</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/farmers/new"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            농민 등록
          </Link>
          {selectedFarmers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              선택 삭제
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFarmers.map(farmer => (
          <div
            key={farmer.id}
            className={`border rounded-lg p-4 ${
              selectedFarmers.includes(farmer.id) ? 'border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFarmers.includes(farmer.id)}
                  onChange={() => handleSelectFarmer(farmer.id)}
                  className="w-4 h-4"
                />
                <h2 className="text-xl font-semibold">{farmer.name}</h2>
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/farmers/${farmer.id}/edit`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  수정
                </Link>
                <button
                  onClick={(e) => handleDelete(e, farmer.id)}
                  className="text-red-500 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <p>전화번호: {farmer.phone}</p>
              <p>주소: {farmer.roadAddress}</p>
              <div>
                <p>농사 유형:</p>
                <ul className="list-disc list-inside pl-4">
                  {Object.entries(farmer.farmingTypes || {})
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <li key={key}>{getFarmingTypeDisplay(key)}</li>
                    ))}
                </ul>
              </div>
              <div>
                <p>주요 작물:</p>
                <ul className="list-disc list-inside pl-4">
                  {Object.entries(farmer.mainCrop || {})
                    .filter(([_, value]) => value)
                    .map(([key]) => (
                      <li key={key}>{getMainCropDisplay(key)}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 