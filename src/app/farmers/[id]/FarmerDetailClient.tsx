'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Farmer, Equipment } from '@/types/farmer'

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

interface Equipment {
  type: string
  manufacturer?: string
  model?: string
  year?: string
  usageHours?: string
  rating?: string
  memo?: string
  attachments?: any
  tradeType?: 'sale' | 'purchase'
  desiredPrice?: string
  purchasePrice?: string
  tradeStatus?: string
}

// 농기계 타입 매핑
const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'rice_transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skid_loader': '스키로더',
  'dryer': '건조기',
  'silo': '싸일론',
  'claas': '클라스',
  'drone': '드론'
}

// 제조사 매핑
const manufacturerMap: { [key: string]: string } = {
  'daedong': '대동',
  'kukje': '국제',
  'ls': 'LS',
  'dongyang': '동양',
  'asia': '아세아',
  'yanmar': '얀마',
  'iseki': '이세키',
  'john_deere': '존디어',
  'kubota': '구보다',
  'fendt': '펜트',
  'case': '케이스',
  'new_holland': '뉴홀랜드',
  'mf': 'MF',
  'kumsung': '금성',
  'fiat': '피아트',
  'hyundai': '현대',
  'doosan': '두산',
  'volvo': '볼보',
  'samsung': '삼성',
  'daewoo': '대우',
  'hitachi': '히타치',
  'claas': '클라스'
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

// 별점 표시 함수 추가
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

interface Props {
  farmerId: string;
}

export default function FarmerDetailClient({ farmerId }: Props) {
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'farmer' | 'equipment' | 'attachment'>('farmer')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', farmerId)
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
  }, [farmerId])

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

  // 농기계 목록 섹션
  const renderEquipmentList = () => {
    if (!farmer.equipments || farmer.equipments.length === 0) {
      return <p className="text-gray-500">보유 농기계가 없습니다.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmer.equipments.map((equipment, index) => {
          const equipmentType = Object.entries(equipmentTypeMap).find(([code, _]) => code === equipment.type)?.[1] || equipment.type;
          const manufacturer = manufacturerMap[equipment.manufacturer] || equipment.manufacturer;
          const attachmentInfo = getAttachmentInfo(equipment);
          
          return (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{equipmentType}</h3>
                  <p className="text-sm text-gray-600">{manufacturer} {equipment.model}</p>
                </div>
                <div className="flex gap-1">
                  {equipment.tradeType === 'sale' && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      판매
                    </span>
                  )}
                  {equipment.tradeType === 'purchase' && (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                      구매
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">연식:</span> {equipment.year}
                </p>
                <p>
                  <span className="font-medium">사용시간:</span> {equipment.usageHours}시간
                </p>
                <div>
                  <span className="font-medium">상태:</span> {getRatingStars(equipment.rating || '0')}
                </div>
                {equipment.tradeType === 'sale' && (
                  <>
                    <p>
                      <span className="font-medium">판매가:</span> {Number(equipment.desiredPrice || 0).toLocaleString()}만원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {equipment.tradeStatus || '상담 전'}
                    </p>
                  </>
                )}
                {equipment.tradeType === 'purchase' && (
                  <>
                    <p>
                      <span className="font-medium">구매희망가:</span> {Number(equipment.purchasePrice || 0).toLocaleString()}만원
                    </p>
                    <p>
                      <span className="font-medium">진행상태:</span> {equipment.tradeStatus || '상담 전'}
                    </p>
                  </>
                )}
                
                {/* 부착작업기 정보 */}
                {attachmentInfo.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="font-medium mb-2">부착작업기</p>
                    <div className="space-y-2">
                      {attachmentInfo.map((attachment, idx) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded">
                          <p className="font-medium text-gray-700">{attachment.name}</p>
                          <div className="ml-2">
                            <p>제조사: {manufacturerMap[attachment.manufacturer] || attachment.manufacturer}</p>
                            {attachment.model && <p>모델: {attachment.model}</p>}
                            {attachment.rating && (
                              <div className="flex items-center">
                                <span>상태: </span>
                                {getRatingStars(attachment.rating)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 메모 정보 */}
                {equipment.memo && (
                  <div className="mt-3 border-t pt-3">
                    <p className="font-medium">메모</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{equipment.memo}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
        {renderEquipmentList()}
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