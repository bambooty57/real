'use client';

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore'
import { db, storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { v4 as uuidv4 } from 'uuid'
import BasicInfo from '@/components/farmer/BasicInfo'
import FarmingInfo from '@/components/farmer/FarmingInfo'
import EquipmentInfo from '@/components/farmer/EquipmentInfo'
import { FormData, MainCrop, FarmingTypes, Equipment } from '@/types/farmer'
import { toast } from 'react-hot-toast'

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
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
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

  useEffect(() => {
    const loadFarmerData = async () => {
      try {
        const farmerDoc = await getDoc(doc(db, 'farmers', id!));
        if (farmerDoc.exists()) {
          const farmerData = farmerDoc.data();
          setFormData((prev: FormData) => ({
            ...prev,
            // 1. 기본 정보
            name: farmerData.name,
            phone: farmerData.phone,
            businessName: farmerData.businessName,
            zipCode: farmerData.zipCode,
            roadAddress: farmerData.roadAddress,
            jibunAddress: farmerData.jibunAddress,
            addressDetail: farmerData.addressDetail,
            canReceiveMail: farmerData.canReceiveMail,
            ageGroup: farmerData.ageGroup,
            memo: farmerData.memo,
            rating: farmerData.rating || 0,

            // 2. 영농 정보
            mainCrop: farmerData.mainCrop,
            farmingTypes: farmerData.farmingTypes,

            // 3. 이미지 관련
            farmerImages: farmerData.farmerImages || [], // 농민 이미지

            // 4. 장비 정보 (장비 이미지 포함)
            equipments: (farmerData.equipments || []).map(equipment => ({
              ...equipment,
              images: equipment.images || [], // 장비 이미지
              attachments: (equipment.attachments || []).map(attachment => ({
                ...attachment,
                images: attachment.images || [] // 부착장비 이미지
              }))
            }))
          }));
        }
      } catch (error) {
        console.error('농민 정보 로딩 실패:', error);
      }
    };

    if (id) {
      loadFarmerData();
    }
  }, [id]);

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
          const selectedCrop: { [key: string]: any } = formData.mainCrop || {};
          const cropTypes = ['foodCrops', 'facilityHort', 'fieldVeg', 'fruits', 'specialCrops', 'flowers', 'livestock'] as const;
          
          // MainCrop 타입에 맞는 기본 객체 생성
          const result: MainCrop = {
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
          };

          // 선택된 작물 타입 설정
          cropTypes.forEach(type => {
            if (selectedCrop[type]) {
              result[type] = true;
              result[`${type}Details`] = selectedCrop[`${type}Details`] || [];
            }
          });
          
          return result;  // 항상 객체 반환
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
        if (id) {
          // 수정 모드
          const docRef = doc(db, 'farmers', id)
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
      <h1 className="text-2xl font-bold mb-6">{id ? '농민 정보 수정' : '새 농민 등록'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 기본 정보 */}
        <BasicInfo 
          formData={formData} 
          setFormData={setFormData}
        />

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
            {isSubmitting ? '처리중...' : (id ? '수정' : '등록')}
          </button>
        </div>
      </form>
    </div>
  );
} 