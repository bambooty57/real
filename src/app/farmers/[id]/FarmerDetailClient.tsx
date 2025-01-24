'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Farmer, Equipment } from '@/types/farmer'
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings'

interface AttachmentImages {
  loader?: string[]
  rotary?: string[]
  cutter?: string[]
  rows?: string[]
  tonnage?: string[]
  size?: string[]
  bucketSize?: string[]
  frontWheel?: string[]
  rearWheel?: string[]
}

// 별점 표시 함수
const getRatingStars = (rating: string) => {
  const numRating = parseInt(rating);
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= numRating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-gray-600">({rating}점)</span>
    </div>
  );
};

interface FarmerDetailClientProps {
  farmerId: string
}

export default function FarmerDetailClient({ farmerId }: FarmerDetailClientProps) {
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchFarmerData() {
      try {
        const docRef = doc(db, 'farmers', farmerId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setFarmer({ id: docSnap.id, ...docSnap.data() } as Farmer)
        } else {
          setError('농민 정보를 찾을 수 없습니다.')
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
        console.error('Error fetching farmer data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFarmerData()
  }, [farmerId])

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 농민 정보를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'farmers', farmerId))
      router.push('/')
    } catch (error) {
      console.error('Error deleting farmer:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return <div>데이터를 불러오는 중...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (!farmer) {
    return <div>농민 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{farmer.name} 상세 정보</h1>
        <div className="space-x-2">
          <Link
            href={`/farmers/${farmerId}/edit`}
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-gray-600">이름</dt>
            <dd className="font-medium">{farmer.name}</dd>
          </div>
          {farmer.businessName && (
            <div>
              <dt className="text-gray-600">상호명</dt>
              <dd className="font-medium">{farmer.businessName}</dd>
            </div>
          )}
          <div>
            <dt className="text-gray-600">주소</dt>
            <dd className="font-medium">
              {farmer.roadAddress} {farmer.addressDetail}
            </dd>
          </div>
          <div>
            <dt className="text-gray-600">우편수취</dt>
            <dd className="font-medium">{farmer.canReceiveMail ? '가능' : '불가능'}</dd>
          </div>
          <div>
            <dt className="text-gray-600">전화번호</dt>
            <dd className="font-medium">{farmer.phone}</dd>
          </div>
          <div>
            <dt className="text-gray-600">연령대</dt>
            <dd className="font-medium">{farmer.ageGroup}</dd>
          </div>
        </dl>
      </div>

      {farmer.memo && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">메모</h2>
          <p className="whitespace-pre-wrap">{farmer.memo}</p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">농업 형태</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(farmer.farmingTypes).map(([key, value]) => {
            if (!value) return null;
            const labels = {
              paddyFarming: '논농사',
              fieldFarming: '밭농사',
              orchard: '과수원',
              livestock: '축산업',
              forageCrop: '조사료'
            };
            return (
              <div key={key} className="flex items-center">
                <span className="text-blue-600">✓</span>
                <span className="ml-2">{labels[key as keyof typeof labels]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">주요 작물</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(farmer.mainCrop).map(([key, value]) => {
            if (!value) return null;
            const labels = {
              rice: '벼',
              barley: '보리',
              hanwoo: '한우',
              soybean: '콩',
              sweetPotato: '고구마',
              persimmon: '감',
              pear: '배',
              plum: '자두',
              sorghum: '수수',
              goat: '염소',
              other: '기타'
            };
            return (
              <div key={key} className="flex items-center">
                <span className="text-blue-600">✓</span>
                <span className="ml-2">{labels[key as keyof typeof labels]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {farmer.equipments.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">보유 농기계</h2>
          <div className="space-y-6">
            {farmer.equipments.map((equipment, index) => (
              <div key={equipment.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                <h3 className="font-semibold mb-2">농기계 #{index + 1}</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-600">기종</dt>
                    <dd className="font-medium">{equipment.type}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">제조사</dt>
                    <dd className="font-medium">{equipment.manufacturer}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">모델명</dt>
                    <dd className="font-medium">{equipment.model}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">연식</dt>
                    <dd className="font-medium">{equipment.year}년</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">사용시간</dt>
                    <dd className="font-medium">{equipment.usageHours}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">상태등급</dt>
                    <dd className="font-medium">
                      {'★'.repeat(Number(equipment.rating))}
                      {'☆'.repeat(5 - Number(equipment.rating))}
                    </dd>
                  </div>
                  {equipment.memo && (
                    <div className="col-span-2">
                      <dt className="text-gray-600">메모</dt>
                      <dd className="font-medium whitespace-pre-wrap">{equipment.memo}</dd>
                    </div>
                  )}
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 