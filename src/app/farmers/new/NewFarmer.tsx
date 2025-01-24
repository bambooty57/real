'use client';

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AddressSearch from '@/components/AddressSearch'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { v4 as uuidv4 } from 'uuid'
import { Equipment } from '@/types/farmer'

interface FormData {
  name: string;
  businessName: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  canReceiveMail: boolean;
  phone: string;
  ageGroup: string;
  memo: string;
  farmerImages: string[];
  mainImages: string[];
  attachmentImages: {
    loader: string[];
    rotary: string[];
    frontWheel: string[];
    rearWheel: string[];
  };
  mainCrop: {
    rice: boolean;
    barley: boolean;
    hanwoo: boolean;
    soybean: boolean;
    sweetPotato: boolean;
    persimmon: boolean;
    pear: boolean;
    plum: boolean;
    sorghum: boolean;
    goat: boolean;
    other: boolean;
  };
  farmingTypes: {
    paddyFarming: boolean;
    fieldFarming: boolean;
    orchard: boolean;
    livestock: boolean;
    forageCrop: boolean;
  };
  equipments: Equipment[];
}

interface Props {
  mode?: string;
  farmerId?: string;
  initialData?: FormData | null;
}

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }: Props) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        equipments: initialData.equipments?.map((eq: Equipment) => ({
          ...eq,
          id: eq.id || uuidv4()  // 기존 id가 없으면 새로 생성
        })) || []
      };
    }
    return {
      name: '',
      businessName: '',
      zipCode: '',
      roadAddress: '',
      jibunAddress: '',
      addressDetail: '',
      canReceiveMail: false,
      phone: '',
      ageGroup: '',
      memo: '',
      farmerImages: [],
      mainImages: [],
      attachmentImages: {
        loader: [],
        rotary: [],
        frontWheel: [],
        rearWheel: []
      },
      mainCrop: {
        rice: false,
        barley: false,
        hanwoo: false,
        soybean: false,
        sweetPotato: false,
        persimmon: false,
        pear: false,
        plum: false,
        sorghum: false,
        goat: false,
        other: false
      },
      farmingTypes: {
        paddyFarming: false,
        fieldFarming: false,
        orchard: false,
        livestock: false,
        forageCrop: false,
      },
      equipments: []  // 빈 배열로 초기화
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (mode === 'edit' && farmerId) {
        // 수정 모드
        const docRef = doc(db, 'farmers', farmerId)
        await updateDoc(docRef, formData)
        router.push('/farmers')  // 수정 후 목록 페이지로 이동
      } else {
        // 새로운 등록 모드
        const docRef = collection(db, 'farmers')
        const newFarmerRef = await addDoc(docRef, formData)
        router.push(`/farmers/${newFarmerRef.id}`)  // 등록 후 상세 페이지로 이동
      }
    } catch (error) {
      console.error('Error saving farmer:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{mode === 'edit' ? '농민 정보 수정' : '새 농민 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">기본 정보</h2>
          
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름 *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* 상호명 */}
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">상호명</label>
            <input
              type="text"
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, businessName: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">주소 *</label>
            <AddressSearch
              onComplete={(data) => {
                setFormData(prev => ({
                  ...prev,
                  zipCode: data.zonecode,
                  roadAddress: data.roadAddress,
                  jibunAddress: data.jibunAddress,
                }))
              }}
            />
          </div>

          {/* 상세주소 */}
          <div>
            <label htmlFor="addressDetail" className="block text-sm font-medium text-gray-700">상세주소</label>
            <input
              type="text"
              id="addressDetail"
              value={formData.addressDetail}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, addressDetail: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* 우편수취가능여부 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.canReceiveMail}
                onChange={(e) => setFormData((prev: FormData) => ({ ...prev, canReceiveMail: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">우편수취 가능</span>
            </label>
          </div>

          {/* 전화번호 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호 *</label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* 연령대 */}
          <div>
            <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">연령대 *</label>
            <select
              id="ageGroup"
              value={formData.ageGroup}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, ageGroup: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">선택하세요</option>
              <option value="20대">20대</option>
              <option value="30대">30대</option>
              <option value="40대">40대</option>
              <option value="50대">50대</option>
              <option value="60대">60대</option>
              <option value="70대 이상">70대 이상</option>
            </select>
          </div>
        </div>

        {/* 영농 정보 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">영농 정보</h2>
          
          {/* 영농형태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">영농형태</label>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData.farmingTypes).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData((prev: FormData) => ({
                      ...prev,
                      farmingTypes: {
                        ...prev.farmingTypes,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key === 'paddyFarming' ? '벼농사' :
                     key === 'fieldFarming' ? '밭농사' :
                     key === 'orchard' ? '과수원' :
                     key === 'livestock' ? '축산업' :
                     key === 'forageCrop' ? '사료작물' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 주작물 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">주작물</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(formData.mainCrop).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setFormData((prev: FormData) => ({
                      ...prev,
                      mainCrop: {
                        ...prev.mainCrop,
                        [key]: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key === 'rice' ? '벼' :
                     key === 'barley' ? '보리' :
                     key === 'hanwoo' ? '한우' :
                     key === 'soybean' ? '콩' :
                     key === 'sweetPotato' ? '고구마' :
                     key === 'persimmon' ? '감' :
                     key === 'pear' ? '배' :
                     key === 'plum' ? '매실' :
                     key === 'sorghum' ? '수수' :
                     key === 'goat' ? '염소' :
                     key === 'other' ? '기타' : key}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="memo" className="block text-sm font-medium text-gray-700">메모</label>
            <textarea
              id="memo"
              value={formData.memo}
              onChange={(e) => setFormData((prev: FormData) => ({ ...prev, memo: e.target.value }))}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {mode === 'edit' ? '수정하기' : '등록하기'}
        </button>
      </form>
    </div>
  )
} 