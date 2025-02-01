'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import BasicInfo from '@/components/farmer/BasicInfo'
import FarmingInfo from '@/components/farmer/FarmingInfo'
import EquipmentInfo from '@/components/farmer/EquipmentInfo'
import { FormData } from '@/types/farmer'
import { toast } from 'react-hot-toast'

interface MainCrop {
  foodCrops: boolean;
  facilityHort: boolean;
  fieldVeg: boolean;
  fruits: boolean;
  specialCrops: boolean;
  flowers: boolean;
  livestock: boolean;
  foodCropsDetails: string[];
  facilityHortDetails: string[];
  fieldVegDetails: string[];
  fruitsDetails: string[];
  specialCropsDetails: string[];
  flowersDetails: string[];
  livestockDetails: string[];
}

interface FarmingTypes {
  waterPaddy: boolean;
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
  onSubmit?: (data: FormData) => Promise<void>
  onCancel?: () => void
}

export default function NewFarmer({ 
  mode = 'new', 
  farmerId = '', 
  initialData = null,
  onSubmit,
  onCancel
}: Props) {
  const router = useRouter()
  
  const [formData, setFormData] = useState<FormData>(() => {
    if (initialData) {
      return {
        ...initialData,
        farmerImages: initialData.farmerImages || []
      };
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
        foodCrops: false,
        facilityHort: false,
        fieldVeg: false,
        fruits: false,
        specialCrops: false,
        flowers: false,
        livestock: false,
        foodCropsDetails: [],
        facilityHortDetails: [],
        fieldVegDetails: [],
        fruitsDetails: [],
        specialCropsDetails: [],
        flowersDetails: [],
        livestockDetails: []
      },
      farmingTypes: {
        waterPaddy: false,
        fieldFarming: false,
        orchard: false,
        livestock: false,
        forageCrop: false
      },
      equipments: [],
      rating: 0
    }
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 데이터 유효성 검사
      if (!String(formData.name).trim()) {
        toast.error('이름은 필수 입력 항목입니다.')
        setIsSubmitting(false)
        return
      }

      // 중복확인 여부 체크
      const basicInfoComponent = document.querySelector('input[name="name"]');
      const isVerified = basicInfoComponent?.classList.contains('border-green-500');
      
      if (!isVerified && mode === 'new') {
        toast.error('이름 중복확인이 필요합니다.')
        setIsSubmitting(false)
        return
      }

      // 이미지 파일들을 Storage에 업로드하고 URL 받아오기
      const uploadImages = async (images: (string | File)[]) => {
        const uploadedUrls = await Promise.all(
          images.map(async (image) => {
            if (image instanceof File) {
              const storageRef = ref(storage, `farmers/${Date.now()}_${image.name}`);
              const snapshot = await uploadBytes(storageRef, image);
              return await getDownloadURL(snapshot.ref);
            }
            return image; // 이미 URL인 경우 그대로 반환
          })
        );
        return uploadedUrls;
      };

      // 장비 이미지 업로드
      const equipmentsWithUrls = await Promise.all(
        formData.equipments.map(async (equipment) => {
          const equipmentWithUrls = { ...equipment };
          
          // 장비 이미지 업로드
          if (equipment.images?.length) {
            equipmentWithUrls.images = await uploadImages(equipment.images);
          }

          // 부착물 이미지 업로드
          if (equipment.attachments?.length) {
            equipmentWithUrls.attachments = await Promise.all(
              equipment.attachments.map(async (attachment) => {
                const attachmentWithUrls = { ...attachment };
                if (attachment.images?.length) {
                  attachmentWithUrls.images = await uploadImages(attachment.images);
                }
                return attachmentWithUrls;
              })
            );
          }

          return equipmentWithUrls;
        })
      );

      // undefined 값 제거 및 기본값 설정
      const saveData = {
        name: String(formData.name).trim() || '',
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
        mainCrop: (() => {
          const selectedCrop = formData.mainCrop || {};
          const cropTypes = ['foodCrops', 'facilityHort', 'fieldVeg', 'fruits', 'specialCrops', 'flowers', 'livestock'];
          
          // 선택된 모든 작물 타입에 대한 데이터 저장
          const result = {};
          cropTypes.forEach(type => {
            if (selectedCrop[type]) {
              result[type] = true;
              result[`${type}Details`] = selectedCrop[`${type}Details`] || [];
            }
          });
          
          return Object.keys(result).length > 0 ? result : null;
        })(),
        farmingTypes: formData.farmingTypes || {
          waterPaddy: false,
          fieldFarming: false,
          orchard: false,
          livestock: false,
          forageCrop: false
        },
        equipments: equipmentsWithUrls,
        rating: formData.rating || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (onSubmit) {
        await onSubmit(saveData)
      } else {
        if (mode === 'edit' && farmerId) {
          // 수정 모드
          const docRef = doc(db, 'farmers', farmerId)
          await updateDoc(docRef, saveData)
          toast.success('수정이 완료되었습니다.')
          // 현재 URL의 쿼리 파라미터 유지
          const currentUrl = new URL(window.location.href)
          const searchParams = currentUrl.searchParams
          router.push(`/farmers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
        } else {
          // 새로운 등록 모드
          const docRef = collection(db, 'farmers')
          const newFarmerRef = await addDoc(docRef, saveData)
          toast.success('농가 정보가 성공적으로 등록되었습니다.')
          router.push('/farmers')
        }
      }
    } catch (error) {
      console.error('Error saving farmer:', error)
      toast.error('농가 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
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

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel()
              } else {
                // 현재 URL의 쿼리 파라미터 유지
                const currentUrl = new URL(window.location.href)
                const searchParams = currentUrl.searchParams
                router.push(`/farmers${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
              }
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={isSubmitting}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리중...' : (mode === 'edit' ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  );
} 