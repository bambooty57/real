'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { v4 as uuidv4 } from 'uuid'
import BasicInfo from '@/components/farmer/BasicInfo'
import FarmingInfo from '@/components/farmer/FarmingInfo'
import EquipmentInfo from '@/components/farmer/EquipmentInfo'
import { FormData } from '@/types/farmer'

interface MainCrop {
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
}

interface FarmingTypes {
  paddyFarming: boolean;
  fieldFarming: boolean;
  orchard: boolean;
  livestock: boolean;
  forageCrop: boolean;
}

interface Equipment {
  id: string;
  type: string;
  manufacturer: string;
  model: string;
  horsepower: string;
  year: string;
  usageHours: string;
  condition: number;
  images: string[];
  saleType: "new" | "used" | null;
  tradeType: string;
  desiredPrice: string;
  saleStatus: string;
  attachments?: Array<{
    type: "loader" | "rotary" | "frontWheel" | "rearWheel";
    manufacturer: string;
    model: string;
    condition?: number;
    memo?: string;
    images?: (string | File | null)[];
  }>;
}

interface Props {
  mode?: 'new' | 'edit'
  farmerId?: string
  initialData?: FormData | null
}

export default function NewFarmer({ mode = 'new', farmerId = '', initialData = null }: Props) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        canReceiveMail: initialData.canReceiveMail ?? false,
        equipments: initialData.equipments?.map((eq) => ({
          ...eq,
          id: eq.id || uuidv4()
        })) || []
      }
    }
    return {
      name: '',
      phone: '',
      businessName: '',
      zipCode: '',
      roadAddress: '',
      jibunAddress: '',
      addressDetail: '',
      canReceiveMail: false,
      ageGroup: '',
      memo: '',
      farmerImages: [],
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
        forageCrop: false
      },
      equipments: [],
      rating: 0
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 데이터 유효성 검사
      if (!formData.name?.trim()) {
        alert('이름은 필수 입력 항목입니다.')
        return
      }

      // undefined 값 제거 및 기본값 설정
      const saveData = {
        name: formData.name?.trim() || '',
        businessName: formData.businessName?.trim() || '',
        zipCode: formData.zipCode?.trim() || '',
        roadAddress: formData.roadAddress?.trim() || '',
        jibunAddress: formData.jibunAddress?.trim() || '',
        addressDetail: formData.addressDetail?.trim() || '',
        canReceiveMail: formData.canReceiveMail || false,
        phone: formData.phone?.trim() || '',
        ageGroup: formData.ageGroup || '',
        memo: formData.memo?.trim() || '',
        farmerImages: formData.farmerImages || [],
        mainCrop: formData.mainCrop || {
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
        farmingTypes: formData.farmingTypes || {
          paddyFarming: false,
          fieldFarming: false,
          orchard: false,
          livestock: false,
          forageCrop: false
        },
        equipments: (formData.equipments || []).map(eq => ({
          ...eq,
          id: eq.id || uuidv4(),
          type: eq.type || '',
          manufacturer: eq.manufacturer || '',
          model: eq.model || '',
          year: eq.year || '',
          usageHours: eq.usageHours || '',
          condition: eq.condition || 0,
          images: eq.images || [],
          saleType: eq.saleType || 'new',
          tradeType: eq.tradeType || '',
          desiredPrice: eq.desiredPrice || '',
          saleStatus: eq.saleStatus || ''
        })),
        rating: formData.rating || 0,
        updatedAt: new Date().toISOString()
      }

      if (mode === 'edit' && farmerId) {
        // 수정 모드
        const docRef = doc(db, 'farmers', farmerId)
        await updateDoc(docRef, saveData)
        alert('수정이 완료되었습니다.')
        router.push(`/farmers/${farmerId}`)
      } else {
        // 새로운 등록 모드
        const docRef = collection(db, 'farmers')
        const newFarmerRef = await addDoc(docRef, {
          ...saveData,
          createdAt: new Date().toISOString()
        })
        alert('등록이 완료되었습니다.')
        router.push(`/farmers/${newFarmerRef.id}`)
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
        <BasicInfo formData={formData} setFormData={setFormData} />

        {/* 영농 정보 */}
        <FarmingInfo formData={formData} setFormData={setFormData} />

        {/* 농민 이미지 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">농민 이미지</h2>
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const uploadedUrls = await Promise.all(
                  files.map(async (file) => {
                    const storageRef = ref(storage, `farmers/${uuidv4()}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return getDownloadURL(snapshot.ref);
                  })
                );
                setFormData((prev: FormData) => ({
                  ...prev,
                  farmerImages: [...(prev.farmerImages || []), ...uploadedUrls]
                }));
              }}
              className="mt-1 block w-full"
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {(formData.farmerImages || []).filter((url): url is string => url !== null).map((url, index) => (
                <div key={url} className="relative">
                  <img src={url} alt={`농민 이미지 ${index + 1}`} className="w-full h-32 object-cover rounded" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const imageRef = ref(storage, url);
                        await deleteObject(imageRef);
                        setFormData((prev: FormData) => ({
                          ...prev,
                          farmerImages: (prev.farmerImages || []).filter(u => u !== url)
                        }));
                      } catch (error) {
                        console.error('Error deleting image:', error);
                      }
                    }}
                    className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 농기계 정보 */}
        <EquipmentInfo formData={formData} setFormData={setFormData} />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          {mode === 'edit' ? '수정하기' : '등록하기'}
        </button>
      </form>
    </div>
  );
} 