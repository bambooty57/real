'use client'

import { use } from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Image from 'next/image'
import Link from 'next/link'

interface Farmer {
  id: string
  name: string
  companyName: string
  addressDetail: string
  phone: string
  ageGroup: string
  memo: string
  mainCrop: {
    rice: boolean
    barley: boolean
    hanwoo: boolean
    soybean: boolean
    sweetPotato: boolean
    persimmon: boolean
    pear: boolean
    plum: boolean
    sorghum: boolean
    goat: boolean
    other: boolean
  }
  equipments: {
    id: string
    type: string
    manufacturer: string
    model: string
    year: string
    usageHours: string
    rating: string
    forSale: boolean
    desiredPrice: string
    saleStatus?: 'available' | 'reserved' | 'sold'
    saleDate?: string
    forPurchase: boolean
    purchasePrice: string
    purchaseStatus?: 'searching' | 'completed'
    purchaseDate?: string
    attachments?: {
      [key: string]: string;  // Add index signature for dynamic access
      loader: string
      loaderModel: string
      loaderRating: string
      rotary: string
      rotaryModel: string
      rotaryRating: string
      frontWheel: string
      frontWheelModel: string
      frontWheelRating: string
      rearWheel: string
      rearWheelModel: string
      rearWheelRating: string
      cutter: string
      cutterModel: string
      cutterRating: string
      rows: string
      rowsModel: string
      rowsRating: string
      tonnage: string
      tonnageModel: string
      tonnageRating: string
      size: string
      sizeModel: string
      sizeRating: string
      bucketSize: string
      bucketModel: string
      bucketRating: string
    }
  }[]
  images?: string[]
}

interface PageParams {
  id: string;
}

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className: string;
}

const ImageWithFallback = ({ src, alt, className }: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">로딩중...</span>
        </div>
      )}
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">이미지 없음</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
        />
      )}
    </div>
  );
};

const getMainCropText = (mainCrop: Farmer['mainCrop']) => {
  if (!mainCrop) return '없음';
  
  const cropNames: Record<keyof Farmer['mainCrop'], string> = {
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

  const selectedCrops = Object.entries(mainCrop)
    .filter(([_, value]) => value)
    .map(([key]) => cropNames[key as keyof Farmer['mainCrop']]);

  return selectedCrops.length > 0 ? selectedCrops.join(', ') : '없음';
};

export default function FarmerDetailPage({ 
  params 
}: { 
  params: PageParams 
}) {
  const { id } = params;
  const router = useRouter();
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setFarmer({ id: docSnap.id, ...docSnap.data() } as Farmer)
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

  const handleDelete = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteDoc(doc(db, 'farmers', id))
      alert('삭제되었습니다.')
      router.push('/farmers')
    } catch (error) {
      console.error('Error deleting farmer:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setUploading(true)

    try {
      // 파일 확장자 추출
      const fileExt = file.name.split('.').pop()
      // 파일명에서 특수문자 제거하고 타임스탬프 추가
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9]/g, '')
      const fileName = `${sanitizedFileName}-${Date.now()}.${fileExt}`
      
      // 스토리지 경로 생성
      const storageRef = ref(storage, `farmers/${id}/${category}/${fileName}`)
      
      // 이미지 업로드
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      // 현재 이미지 목록 가져오기
      const currentImages = farmer?.images || []

      // Firestore 문서 업데이트
      const docRef = doc(db, 'farmers', id)
      await updateDoc(docRef, {
        images: [...currentImages, downloadURL]
      })

      // 상태 업데이트
      setFarmer(prev => ({
        ...prev!,
        images: [...currentImages, downloadURL]
      }))

      alert('이미지가 업로드되었습니다.')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      // 파일 입력 초기화
      e.target.value = ''
    }
  }

  if (loading) return <div className="p-8">로딩중...</div>
  if (!farmer) return null

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">농민 상세 정보</h1>
      
      {/* 기본 정보 카드 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p className="flex items-center">
              <span className="font-semibold w-24 text-gray-600">이름:</span>
              <span className="text-gray-800">{farmer.name}</span>
            </p>
            <p className="flex items-center">
              <span className="font-semibold w-24 text-gray-600">상호:</span>
              <span className="text-gray-800">{farmer.companyName || '-'}</span>
            </p>
            <p className="flex items-center">
              <span className="font-semibold w-24 text-gray-600">연령대:</span>
              <span className="text-gray-800">{farmer.ageGroup}</span>
            </p>
          </div>
          <div className="space-y-3">
            <p className="flex items-center">
              <span className="font-semibold w-24 text-gray-600">전화번호:</span>
              <a href={`tel:${farmer.phone}`} className="text-blue-600 hover:underline">
                {farmer.phone}
              </a>
            </p>
            <div className="flex">
              <span className="font-semibold w-24 text-gray-600">주소:</span>
              <a 
                href={`https://map.kakao.com/link/search/${encodeURIComponent(farmer.addressDetail)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {farmer.addressDetail}
              </a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500">주요 작물:</span>
            <span className="font-medium ml-2">{getMainCropText(farmer.mainCrop)}</span>
          </div>
        </div>
      </div>

      {/* 농업 형태 및 작물 정보 카드 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">농업 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 농업 형태 */}
          <div>
            <h3 className="text-xl font-medium mb-3 text-gray-600">농업 형태</h3>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <p className="text-gray-800">{farmer.mainCrop.rice ? '벼' : farmer.mainCrop.barley ? '보리' : farmer.mainCrop.soybean ? '콩' : farmer.mainCrop.sweetPotato ? '고구마' : farmer.mainCrop.persimmon ? '감' : farmer.mainCrop.pear ? '배' : farmer.mainCrop.plum ? '자두' : farmer.mainCrop.sorghum ? '수수' : farmer.mainCrop.goat ? '염소' : '기타'}</p>
            </div>
          </div>
          
          {/* 주요 작물 */}
          <div>
            <h3 className="text-xl font-medium mb-3 text-gray-600">주요 작물</h3>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              {farmer.mainCrop.rice && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">벼</span>}
              {farmer.mainCrop.barley && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">보리</span>}
              {farmer.mainCrop.soybean && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">콩</span>}
              {farmer.mainCrop.sweetPotato && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">고구마</span>}
              {farmer.mainCrop.persimmon && <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">감</span>}
              {farmer.mainCrop.pear && <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">배</span>}
              {farmer.mainCrop.plum && <span className="inline-block bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">자두</span>}
              {farmer.mainCrop.sorghum && <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">수수</span>}
              {farmer.mainCrop.goat && <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">염소</span>}
              {farmer.mainCrop.other && <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">기타</span>}
            </div>
          </div>
        </div>
      </div>

      {/* 보유 농기계 현황 */}
      {farmer.equipments && farmer.equipments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">보유 농기계 현황</h2>
            <div className="flex gap-2">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                총 {farmer.equipments.length}대
              </span>
              {farmer.equipments.some(eq => eq.forSale) && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  판매 {farmer.equipments.filter(eq => eq.forSale).length}대
                </span>
              )}
              {farmer.equipments.some(eq => eq.forPurchase) && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  구매 {farmer.equipments.filter(eq => eq.forPurchase).length}대
                </span>
              )}
            </div>
          </div>
          
          {/* 농기계 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmer.equipments.map((equipment) => (
              <div 
                key={equipment.id} 
                className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-l-4 ${
                  equipment.forSale ? 'border-green-500' : 
                  equipment.forPurchase ? 'border-purple-500' : 
                  'border-gray-300'
                }`}
              >
                {/* 헤더 섹션 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    {/* 제조사 로고 */}
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {equipment.manufacturer === '대동' && (
                        <img src="/logos/daedong.png" alt="대동" className="w-10 h-10 object-contain" />
                      )}
                      {equipment.manufacturer === '국제' && (
                        <img src="/logos/kukje.png" alt="국제" className="w-10 h-10 object-contain" />
                      )}
                      {equipment.manufacturer === '엘에스' && (
                        <img src="/logos/ls.png" alt="엘에스" className="w-10 h-10 object-contain" />
                      )}
                      {/* 로고가 없는 경우 제조사명 표시 */}
                      {!['대동', '국제', '엘에스'].includes(equipment.manufacturer) && (
                        <span className="text-sm font-medium text-gray-600">{equipment.manufacturer}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{equipment.type}</h3>
                      <p className="text-sm text-gray-600">{equipment.model}</p>
                    </div>
                  </div>
                  {/* 거래 상태 뱃지 */}
                  <div className="flex flex-col items-end gap-2">
                    {equipment.forSale && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          판매가능
                        </span>
                        {equipment.saleStatus && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            equipment.saleStatus === 'available' ? 'bg-blue-100 text-blue-800' :
                            equipment.saleStatus === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {equipment.saleStatus === 'available' ? '상담가능' :
                             equipment.saleStatus === 'reserved' ? '상담중' :
                             '계약완료'}
                          </span>
                        )}
                        {equipment.desiredPrice && (
                          <span className="text-lg font-bold text-green-600">
                            {parseInt(equipment.desiredPrice).toLocaleString()}원
                          </span>
                        )}
                      </div>
                    )}
                    {equipment.forPurchase && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          구매희망
                        </span>
                        {equipment.purchaseStatus && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            equipment.purchaseStatus === 'searching' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {equipment.purchaseStatus === 'searching' ? '구매중' : '구매완료'}
                          </span>
                        )}
                        {equipment.purchasePrice && (
                          <span className="text-lg font-bold text-purple-600">
                            {parseInt(equipment.purchasePrice).toLocaleString()}원
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 상세 정보 섹션 */}
                <div className="space-y-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">연식:</span>
                      <span className="font-medium">{equipment.year}</span>
                    </div>
                  </div>
                  
                  {/* 사용시간 게이지 바 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">사용시간:</span>
                      <span className="font-medium">{equipment.usageHours}시간</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          parseInt(equipment.usageHours) < 1000 ? 'bg-green-500' :
                          parseInt(equipment.usageHours) < 3000 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(parseInt(equipment.usageHours) / 50, 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0시간</span>
                      <span>5,000시간</span>
                    </div>
                  </div>

                  {/* 상태등급 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">상태등급:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            parseInt(equipment.rating) >= star
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 부착장비 정보 */}
                {equipment.attachments && Object.entries(equipment.attachments).some(([key, value]) => 
                  !key.includes('Model') && !key.includes('Rating') && value
                ) && (
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">부착장비</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries({
                        loader: '로더',
                        rotary: '로터리',
                        frontWheel: '전륜',
                        rearWheel: '후륜',
                        cutter: '커터',
                        rows: '열수',
                        tonnage: '톤수',
                        size: '규격',
                        bucketSize: '버켓규격'
                      }).map(([key, label]) => 
                        equipment.attachments?.[key] ? (
                          <div key={key} className="text-sm">
                            <span className="text-gray-500">{label}:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{equipment.attachments[key]}</span>
                              {equipment.attachments?.[`${key}Rating`] && (
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                      key={star}
                                      className={`text-xs ${
                                        parseInt(equipment.attachments?.[`${key}Rating`] || '0') >= star
                                          ? 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메모 카드 */}
      {farmer.memo && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">메모</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="whitespace-pre-wrap text-gray-800">{farmer.memo}</p>
          </div>
        </div>
      )}

      {/* 이미지 갤러리 */}
      {farmer.images && farmer.images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">이미지 갤러리</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {farmer.images.map((url, index) => (
              <div key={index} className="relative">
                <ImageWithFallback
                  src={url}
                  alt={`농민 사진 ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
                <button
                  onClick={(e) => handleDelete(e, url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="flex justify-end space-x-4">
        <Link
          href={`/farmers/${id}/edit`}
          className="py-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-colors"
        >
          수정하기
        </Link>
        <button
          onClick={(e) => handleDelete(e, '')}
          className="py-2 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors"
        >
          삭제하기
        </button>
        <Link
          href="/farmers"
          className="py-2 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
        >
          목록으로
        </Link>
      </div>
    </div>
  )
} 