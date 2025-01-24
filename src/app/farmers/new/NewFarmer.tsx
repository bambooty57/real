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

interface Props {
  mode?: string;
  farmerId?: string;
  initialData?: any;
}

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }: Props) {
  const router = useRouter()
  
  const [formData, setFormData] = useState(() => {
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
      } else {
        // 새로운 등록 모드
        const docRef = collection(db, 'farmers')
        await addDoc(docRef, formData)
      }
      
      router.push('/farmers')  // 목록 페이지로 이동
    } catch (error) {
      console.error('Error saving farmer:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{mode === 'edit' ? '농민 정보 수정' : '새 농민 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
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