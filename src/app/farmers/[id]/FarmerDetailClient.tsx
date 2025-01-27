'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Farmer, Equipment } from '@/types/farmer'
import { getFarmingTypeDisplay, getMainCropDisplay, getKoreanEquipmentType, getKoreanManufacturer } from '@/utils/mappings'
import { FaPrint } from 'react-icons/fa'
import React from 'react'

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
const getRatingStars = (rating: number) => {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
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

  const handlePrint = () => {
    window.print()
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
      <style>{`
        @media print {
          /* 기본 인쇄 스타일 */
          body {
            padding: 20px;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* 1페이지: 기본정보 2열 배치 */
          .print-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            page-break-after: always;
          }
          
          /* 2페이지: 보유농기계 2열 배치 */
          .equipment-info-section {
            page-break-before: always;
          }
          
          .equipment-info-section .grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 20px;
          }
          
          /* 3페이지: 이미지 4열 배치 */
          .images-section {
            page-break-before: always;
          }
          
          .images-section .grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 10px;
          }
          
          /* 각 섹션 스타일 */
          .basic-info-section,
          .equipment-info-section {
            break-inside: avoid;
          }
          
          /* 인쇄 시 숨길 요소들 */
          .print-hide {
            display: none !important;
          }
          
          /* 이미지 크기 조절 */
          .print-image {
            width: 100%;
            max-width: 100%;
            height: auto;
            margin: 10px 0;
            page-break-inside: avoid;
          }

          /* 인쇄 시 배경색 표시 */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="flex justify-between items-center mb-6 print-hide">
        <h1 className="text-2xl font-bold">{farmer.name} 상세 정보</h1>
        <div className="space-x-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            <FaPrint className="mr-2" />
            인쇄
          </button>
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

      {/* 인쇄용 헤더 */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">농민 상세 정보</h1>
        <p className="text-gray-600">{new Date().toLocaleDateString('ko-KR')} 출력</p>
      </div>

      {/* 2열 레이아웃 컨테이너 */}
      <div className="print-grid">
        {/* 1열: 기본 정보 섹션 */}
        <div className="basic-info-section">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            <dl className="grid grid-cols-1 gap-4">
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
              {/* 주소 정보 */}
              <div>
                <dt className="text-gray-600">전화번호</dt>
                <dd className="font-medium">
                  <a 
                    href={`tel:${farmer.phone}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {farmer.phone}
                  </a>
                </dd>
              </div>
              {farmer.zipCode && (
                <div>
                  <dt className="text-gray-600">우편번호</dt>
                  <dd className="font-medium">{farmer.zipCode}</dd>
                </div>
              )}
              {farmer.postalCode && (
                <div>
                  <dt className="text-gray-600">우편번호</dt>
                  <dd className="font-medium">{farmer.postalCode}</dd>
                </div>
              )}
              {farmer.roadAddress && (
                <div>
                  <dt className="text-gray-600">도로명주소</dt>
                  <dd className="font-medium">
                    <a 
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.roadAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {farmer.roadAddress}
                    </a>
                  </dd>
                </div>
              )}
              {farmer.jibunAddress && (
                <div>
                  <dt className="text-gray-600">지번주소</dt>
                  <dd className="font-medium">
                    <a 
                      href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.jibunAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {farmer.jibunAddress}
                    </a>
                  </dd>
                </div>
              )}
              {farmer.addressDetail && (
                <div>
                  <dt className="text-gray-600">상세주소</dt>
                  <dd className="font-medium">{farmer.addressDetail}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-600">우편수취</dt>
                <dd className="font-medium">{farmer.canReceiveMail ? '가능' : '불가능'}</dd>
              </div>
              <div>
                <dt className="text-gray-600">연령대</dt>
                <dd className="font-medium">{farmer.ageGroup}</dd>
              </div>
              {/* 메모 */}
              {farmer.memo && (
                <div>
                  <dt className="text-gray-600">메모</dt>
                  <dd className="font-medium whitespace-pre-wrap">{farmer.memo}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">농업 형태 및 주요 작물</h2>
            {/* 농업 형태 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">농업 형태</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(farmer.farmingTypes).map(([key, value]) => {
                  if (!value) return null;
                  const labels = {
                    waterPaddy: '수도작',
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

            {/* 영농정보메모 */}
            {farmer.farmingMemo && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">영농정보메모</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{farmer.farmingMemo}</p>
                </div>
              </div>
            )}

            {/* 주요 작물 */}
            <div className="space-y-4">
              {/* 식량작물 */}
              {Object.entries({
                rice: '벼',
                barley: '보리',
                wheat: '밀',
                corn: '옥수수',
                potato: '감자',
                soybean: '콩',
                sweetPotato: '고구마'
              }).some(([value]) => farmer.mainCrop?.foodCropsDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">식량작물</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      rice: '벼',
                      barley: '보리',
                      wheat: '밀',
                      corn: '옥수수',
                      potato: '감자',
                      soybean: '콩',
                      sweetPotato: '고구마'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.foodCropsDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 시설원예 */}
              {Object.entries({
                tomato: '토마토',
                strawberry: '딸기',
                cucumber: '오이',
                pepper: '고추',
                watermelon: '수박',
                melon: '멜론'
              }).some(([value]) => farmer.mainCrop?.facilityHortDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">시설원예</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      tomato: '토마토',
                      strawberry: '딸기',
                      cucumber: '오이',
                      pepper: '고추',
                      watermelon: '수박',
                      melon: '멜론'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.facilityHortDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 노지채소 */}
              {Object.entries({
                cabbage: '배추',
                radish: '무',
                garlic: '마늘',
                onion: '양파',
                carrot: '당근'
              }).some(([value]) => farmer.mainCrop?.fieldVegDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">노지채소</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      cabbage: '배추',
                      radish: '무',
                      garlic: '마늘',
                      onion: '양파',
                      carrot: '당근'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.fieldVegDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 과수 */}
              {Object.entries({
                apple: '사과',
                pear: '배',
                grape: '포도',
                peach: '복숭아',
                citrus: '감귤'
              }).some(([value]) => farmer.mainCrop?.fruitsDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">과수</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      apple: '사과',
                      pear: '배',
                      grape: '포도',
                      peach: '복숭아',
                      citrus: '감귤'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.fruitsDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 특용작물 */}
              {Object.entries({
                sesame: '참깨',
                perilla: '들깨',
                ginseng: '인삼',
                medicinalHerbs: '약용작물'
              }).some(([value]) => farmer.mainCrop?.specialCropsDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">특용작물</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      sesame: '참깨',
                      perilla: '들깨',
                      ginseng: '인삼',
                      medicinalHerbs: '약용작물'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.specialCropsDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 화훼 */}
              {Object.entries({
                rose: '장미',
                chrysanthemum: '국화',
                lily: '백합',
                orchid: '난'
              }).some(([value]) => farmer.mainCrop?.flowersDetails?.includes(value)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">화훼</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      rose: '장미',
                      chrysanthemum: '국화',
                      lily: '백합',
                      orchid: '난'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.flowersDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* 축산 */}
              {farmer.mainCrop?.livestock && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-2">축산</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries({
                      cattle: '한우',
                      pig: '돼지',
                      chicken: '닭',
                      duck: '오리',
                      goat: '염소'
                    }).map(([value, label]) => (
                      farmer.mainCrop?.livestockDetails?.includes(value) && (
                        <div key={value} className="text-sm text-gray-600">{label}</div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2열: 보유 농기계 섹션 */}
        <div className="equipment-info-section">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">보유 농기계</h2>
            <div className="space-y-6">
              {farmer.equipments.map((equipment, index) => (
                <div key={equipment.id} className="border-t pt-4 first:border-t-0 first:pt-0">
                  <h3 className="font-semibold mb-2">농기계 #{index + 1}</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-gray-600">기종</dt>
                      <dd className="font-medium">{getKoreanEquipmentType(equipment.type)}</dd>
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
                      <dd className="font-medium">{equipment.usageHours}시간</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600">상태등급</dt>
                      <dd className="font-medium">
                        {getRatingStars(Number(equipment.condition || 0))}
                      </dd>
                    </div>

                    {/* 거래 정보 */}
                    <div className="col-span-2 mt-4 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">거래 정보</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-gray-600">거래유형</dt>
                          <dd className="font-medium">
                            {equipment.tradeType === 'sale' ? '판매' : '구매'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">거래방식</dt>
                          <dd className="font-medium">
                            {equipment.saleType === 'new' ? '신규' : '중고'}
                          </dd>
                        </div>
                        {equipment.desiredPrice && (
                          <div>
                            <dt className="text-gray-600">희망가격</dt>
                            <dd className="font-medium">
                              {Number(equipment.desiredPrice).toLocaleString()}만원
                            </dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-gray-600">거래상태</dt>
                          <dd className="font-medium">
                            <span className={`inline-block px-2 py-1 rounded text-sm ${
                              equipment.saleStatus === 'available' ? 'bg-green-100 text-green-800' :
                              equipment.saleStatus === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                              equipment.saleStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {equipment.saleStatus === 'available' ? '거래가능' :
                               equipment.saleStatus === 'reserved' ? '예약중' :
                               equipment.saleStatus === 'completed' ? '거래완료' : '확인중'}
                            </span>
                          </dd>
                        </div>
                      </div>
                    </div>

                    {equipment.memo && (
                      <div className="col-span-2">
                        <dt className="text-gray-600">메모</dt>
                        <dd className="font-medium whitespace-pre-wrap">{equipment.memo}</dd>
                      </div>
                    )}
                    {/* 부착작업기 정보 */}
                    {equipment.attachments && equipment.attachments.length > 0 && (
                      <div className="col-span-2 mt-4">
                        <dt className="text-gray-600 mb-2">부착작업기</dt>
                        <dd className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {equipment.attachments.map((attachment, attIndex) => (
                            <div key={attIndex} className="bg-gray-50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">
                                {attachment.type === 'loader' ? '로더' :
                                 attachment.type === 'rotary' ? '로터리' :
                                 attachment.type === 'frontWheel' ? '전륜' :
                                 attachment.type === 'rearWheel' ? '후륜' :
                                 attachment.type}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-gray-600">제조사:</span>{' '}
                                  {attachment.manufacturer}
                                </div>
                                <div>
                                  <span className="text-gray-600">모델명:</span>{' '}
                                  {attachment.model}
                                </div>
                                <div>
                                  <span className="text-gray-600">상태:</span>{' '}
                                  {getRatingStars(Number(attachment.condition || 0))}
                                </div>
                                {attachment.memo && (
                                  <div>
                                    <span className="text-gray-600">메모:</span>{' '}
                                    <span className="whitespace-pre-wrap">{attachment.memo}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 섹션 - 새 페이지에 표시 */}
      <div className="images-section bg-white shadow rounded-lg p-6 mb-6">
        {/* 인쇄용 헤더 */}
        <div className="hidden print:block mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">농기계 및 농민 이미지</h1>
            <p className="text-gray-600">{new Date().toLocaleDateString('ko-KR')} 출력</p>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">농기계 및 농민 이미지</h2>
        {/* 농민 이미지 */}
        <div className="grid grid-cols-4 print:grid-cols-1 gap-4 mb-6">
          {farmer.farmerImages?.map((image, index) => (
            <div key={`farmer-${index}`} className="relative print-image aspect-square">
              <img
                src={image}
                alt={`농민 이미지 ${index + 1}`}
                className="object-cover rounded-lg w-full h-full"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                농민 이미지 {index + 1}
              </div>
            </div>
          ))}
        </div>

        {/* 농기계 이미지 */}
        <div className="grid grid-cols-4 print:grid-cols-1 gap-4">
          {farmer.equipments?.map((equipment, eqIndex) => (
            <React.Fragment key={`eq-${eqIndex}`}>
              {/* 본체 이미지 */}
              {equipment.images?.filter((image): image is string => typeof image === 'string').map((image, imgIndex) => (
                <div key={`eq-${eqIndex}-${imgIndex}`} className="relative print-image aspect-square">
                  <img
                    src={image}
                    alt={`${getKoreanEquipmentType(equipment.type)} 이미지 ${imgIndex + 1}`}
                    className="object-cover rounded-lg w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                    {getKoreanEquipmentType(equipment.type)} {imgIndex + 1}
                  </div>
                </div>
              ))}

              {/* 부착작업기 이미지 */}
              {equipment.attachments?.map((attachment, attIndex) => (
                <React.Fragment key={`att-${eqIndex}-${attIndex}`}>
                  {attachment.images?.filter((image): image is string => typeof image === 'string').map((image, imgIndex) => (
                    <div key={`att-${eqIndex}-${attIndex}-${imgIndex}`} className="relative print-image aspect-square">
                      <img
                        src={image}
                        alt={`${getKoreanEquipmentType(equipment.type)}의 ${attachment.type} 이미지 ${imgIndex + 1}`}
                        className="object-cover rounded-lg w-full h-full"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm">
                        {getKoreanEquipmentType(equipment.type)}의 {attachment.type} {imgIndex + 1}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
} 