'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Equipment {
  type: string
  manufacturer?: string
  model?: string
  year?: string
  serialNumber?: string
  usageHours?: string
  forSale?: boolean
  forPurchase?: boolean
  desiredPrice?: string
  purchasePrice?: string
  rating?: number
  modelRating?: number
  memo?: string
  attachments?: {
    [key: string]: string | number | undefined
    loader?: string
    loaderManufacturer?: string
    loaderModel?: string
    loaderRating?: number
    rotary?: string
    rotaryManufacturer?: string
    rotaryModel?: string
    rotaryWidth?: string
    rotaryRating?: number
    frontWheel?: string
    frontWheelModel?: string
    frontWheelRating?: number
    rearWheel?: string
    rearWheelModel?: string
    rearWheelRating?: number
    bucket?: string
    bucketManufacturer?: string
    bucketModel?: string
    bucketSize?: string
  }
  images?: string[]
}

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

interface Farmer {
  id: string
  name: string
  businessName?: string
  roadAddress: string
  jibunAddress: string
  addressDetail?: string
  phone: string
  mainCrop: any
  ageGroup: string
  farmingTypes: {
    fieldFarming?: boolean
    forageCrop?: boolean
    livestock?: boolean
    orchard?: boolean
    paddyFarming?: boolean
  }
  equipments: Equipment[]
  farmerImages?: string[]
  attachmentImages?: AttachmentImages
  memo?: string
}

// 농기계 타입 매핑
const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'rice_transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skid_loader': '스키로더'
}

// 제조사 매핑
const manufacturerMap: { [key: string]: string } = {
  'john_deere': '존디어',
  'kubota': '구보다',
  'daedong': '대동',
  'kukje': '국제',
  'ls': '엘에스',
  'yanmar': '얀마',
  'newholland': '뉴홀랜드',
  'mf': '엠에프',
  'case': '케이스',
  'hyundai': '현대',
  'samsung': '삼성',
  'volvo': '볼보',
  'hitachi': '히타치',
  'doosan': '두산',
  'claas': '클라스',
  'agrico': '아그리코',
  'star': '스타',
  'chevrolet': '시보레',
  'valmet': '발메트'
}

// 작업기 한글명 매핑
const attachmentDisplayNames: { [key: string]: string } = {
  loader: '로더',
  rotary: '로타리',
  frontWheel: '전륜',
  rearWheel: '후륜'
}

// 작물 한글명 매핑
const cropDisplayNames: { [key: string]: string } = {
  rice: '벼',
  sweetPotato: '고구마',
  persimmon: '감',
  barley: '보리',
  other: '기타',
  sorghum: '수수',
  pear: '배',
  soybean: '콩',
  goat: '염소',
  hanwoo: '한우',
  plum: '자두'
}

// 영농형태 한글명 매핑
const farmingTypeDisplayNames: { [key: string]: string } = {
  fieldFarming: '밭농사',
  forageCrop: '사료작물',
  livestock: '축산',
  orchard: '과수원',
  paddyFarming: '논농사'
}

// 작물 표시 함수
const getMainCropDisplay = (mainCrop: any): string => {
  if (typeof mainCrop === 'string') return mainCrop
  
  if (typeof mainCrop === 'object') {
    const crops = Object.entries(mainCrop)
      .filter(([_, value]) => value === true)
      .map(([key]) => cropDisplayNames[key] || key)
    
    return crops.join(', ') || '없음'
  }
  
  return '없음'
}

// 한글 변환 함수
const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
}

const getKoreanManufacturer = (manufacturer: string): string => {
  return manufacturerMap[manufacturer.toLowerCase()] || manufacturer
}

// 영농형태 표시 함수
const getFarmingTypeDisplay = (farmingType: any): string => {
  if (typeof farmingType === 'object') {
    const types = Object.entries(farmingType)
      .filter(([_, value]) => value === true)
      .map(([key]) => farmingTypeDisplayNames[key] || key)
    
    return types.join(', ') || '없음'
  }
  
  return '없음'
}

const getRatingStars = (rating: number) => {
  return (
    <div className="inline-flex ml-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span 
          key={star} 
          className={`${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export default function FarmerDetailClient({ id }: { id: string }) {
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'farmer' | 'equipment' | 'attachment'>('farmer')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setFarmer({
            id: docSnap.id,
            ...docSnap.data()
          } as Farmer)
        } else {
          console.log('No such document!')
        }
      } catch (error) {
        console.error('Error fetching farmer:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFarmer()
  }, [id])

  const getActiveImages = () => {
    if (!farmer) return []

    switch (activeTab) {
      case 'farmer':
        return farmer.farmerImages || []
      case 'equipment':
        return farmer.equipments.flatMap(equipment => equipment.images || [])
      case 'attachment':
        if (!farmer.attachmentImages) return []
        return Object.entries(farmer.attachmentImages).flatMap(([_, images]) => images || [])
      default:
        return []
    }
  }

  const getAttachmentInfo = (equipment: Equipment) => {
    const attachments = equipment.attachments || {};
    const result = [];

    // 로더
    if (attachments.loader) {
      result.push({
        name: '로더',
        manufacturer: attachments.loader,
        model: attachments.loaderModel,
        rating: attachments.loaderRating
      });
    }

    // 로터리
    if (attachments.rotary) {
      result.push({
        name: '로터리',
        manufacturer: attachments.rotary,
        model: attachments.rotaryModel,
        rating: attachments.rotaryRating
      });
    }

    // 전륜
    if (attachments.frontWheel) {
      result.push({
        name: '전륜',
        manufacturer: attachments.frontWheel,
        model: attachments.frontWheelModel,
        rating: attachments.frontWheelRating
      });
    }

    // 후륜
    if (attachments.rearWheel) {
      result.push({
        name: '후륜',
        manufacturer: attachments.rearWheel,
        model: attachments.rearWheelModel,
        rating: attachments.rearWheelRating
      });
    }

    return result;
  }

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
    </div>
  )

  if (!farmer) return (
    <div className="p-8">
      <div className="text-center text-red-500">농민 정보를 찾을 수 없습니다.</div>
    </div>
  )

  const activeImages = getActiveImages()

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* 상단 네비게이션 */}
      <div className="flex justify-end mb-6 print:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            목록
          </button>
          <Link
            href={`/farmers/${farmer.id}/edit`}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            수정
          </Link>
          <button
            onClick={() => window.print()}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            인쇄
          </button>
        </div>
      </div>

      {/* 기본 정보 섹션 */}
      <section className="bg-white rounded-lg shadow p-6 print:shadow-none print:p-0 print:mt-[1cm]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{farmer.name}</h1>
            {farmer.businessName && (
              <span className="text-gray-600">({farmer.businessName})</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">연락처:</span>
                <a 
                  href={`tel:${farmer.phone}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {farmer.phone}
                </a>
              </div>
              <div>
                <span className="font-medium">연령대:</span>
                <span className="ml-2">{farmer.ageGroup}</span>
              </div>
              <div>
                <span className="font-medium">영농형태:</span>
                <span className="ml-2">{getFarmingTypeDisplay(farmer.farmingTypes)}</span>
              </div>
              <div>
                <span className="font-medium">주작물:</span>
                <span className="ml-2">{getMainCropDisplay(farmer.mainCrop)}</span>
              </div>
              {farmer.memo && (
                <div>
                  <span className="font-medium">메모:</span>
                  <span className="ml-2 whitespace-pre-wrap">{farmer.memo}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {farmer.roadAddress && (
                <div>
                  <span className="font-medium">도로명:</span>
                  <a 
                    href={`https://map.kakao.com/link/search/${farmer.roadAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {farmer.roadAddress}
                    {farmer.addressDetail && <span className="ml-1">({farmer.addressDetail})</span>}
                  </a>
                </div>
              )}
              {farmer.jibunAddress && (
                <div>
                  <span className="font-medium">지번:</span>
                  <a 
                    href={`https://map.kakao.com/link/search/${farmer.jibunAddress}${farmer.addressDetail ? ` ${farmer.addressDetail}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {farmer.jibunAddress}
                    {farmer.addressDetail && <span className="ml-1">({farmer.addressDetail})</span>}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 농기계 정보 섹션 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">보유 농기계</h2>
        <div className="space-y-6">
          {farmer.equipments.length > 0 ? (
            farmer.equipments.map((equipment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="space-y-3">
                  {/* 농기계 기본 정보 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="font-medium">
                        {getKoreanEquipmentType(equipment.type)} ({getKoreanManufacturer(equipment.manufacturer || '')})
                      </span>
                      {equipment.model && (
                        <span className="text-sm text-gray-600">{equipment.model}</span>
                      )}
                      {equipment.year && (
                        <span className="text-sm text-gray-600">{equipment.year}년식</span>
                      )}
                      {equipment.usageHours && (
                        <span className="text-sm text-gray-600">{equipment.usageHours}시간 사용</span>
                      )}
                    </div>

                    {/* 별점 표시 */}
                    {equipment.rating && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-600 mr-1">상태:</span>
                        <div className="flex">
                          {getRatingStars(equipment.rating!)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 농기계 메모 */}
                  {equipment.memo && (
                    <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="font-medium">메모:</span>
                      <span className="ml-2 whitespace-pre-wrap">{equipment.memo}</span>
                    </div>
                  )}

                  {/* 거래 정보 */}
                  <div className="flex gap-2">
                    {equipment.forSale && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">판매</span>
                        <span className="text-sm bg-blue-50 text-blue-800 px-2 py-1 rounded">
                          {equipment.desiredPrice}만원
                        </span>
                      </div>
                    )}
                    {equipment.forPurchase && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">구매</span>
                        <span className="text-sm bg-green-50 text-green-800 px-2 py-1 rounded">
                          {equipment.purchasePrice}만원
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 작업기 정보 */}
                  {equipment.attachments && Object.keys(equipment.attachments).some(key => equipment.attachments![key]) && (
                    <div className="border-t pt-3">
                      <h4 className="font-medium mb-2">작업기 정보</h4>
                      <div className="flex flex-wrap gap-2">
                        {getAttachmentInfo(equipment).map((info, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium mb-1">{info.name}</div>
                            <div className="ml-2 space-y-1">
                              <div>제조사: {info.manufacturer}</div>
                              <div>모델: {info.model}</div>
                              {info.rating && (
                                <div className="flex items-center">
                                  <span>상태:</span>
                                  {getRatingStars(info.rating)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">등록된 농기계가 없습니다.</div>
          )}
        </div>
      </section>

      {/* 이미지 갤러리 섹션 */}
      <section className="bg-white rounded-lg shadow p-6 print:break-before-page">
        <h2 className="text-xl font-bold mb-4">이미지 갤러리</h2>
        
        {/* 인쇄시 보이는 모든 이미지 */}
        <div className="space-y-8">
          {/* 농민 사진 */}
          {farmer.farmerImages && farmer.farmerImages.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-4">농민 사진</h3>
              <div className="grid grid-cols-4 gap-4">
                {farmer.farmerImages.map((url, index) => (
                  <div key={index} className="aspect-square">
                    <img
                      src={url}
                      alt={`농민 사진 ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 농기계 사진 */}
          {farmer.equipments.map((equipment, equipIndex) => 
            equipment.images && equipment.images.length > 0 && (
              <div key={equipIndex}>
                <h3 className="text-lg font-bold mb-4">
                  {getKoreanEquipmentType(equipment.type)} ({getKoreanManufacturer(equipment.manufacturer || '')}) 사진
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {equipment.images.map((url: string, imgIndex: number) => (
                    <div key={imgIndex} className="aspect-square">
                      <img
                        src={url}
                        alt={`${getKoreanEquipmentType(equipment.type)} 사진 ${imgIndex + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {/* 작업기 사진 */}
          {farmer.attachmentImages && Object.entries(farmer.attachmentImages).map(([key, images]) =>
            images && images.length > 0 && (
              <div key={key}>
                <h3 className="text-lg font-bold mb-4">{attachmentDisplayNames[key] || key} 사진</h3>
                <div className="grid grid-cols-4 gap-4">
                  {images.map((url: string, index: number) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={url}
                        alt={`${attachmentDisplayNames[key] || key} 사진 ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  )
} 