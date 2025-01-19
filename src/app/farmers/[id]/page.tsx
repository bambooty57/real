'use client'

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
  address: string
  phone: string
  ageGroup: string
  memo: string
  mainCrop: string
  equipment: {
    type: string
    manufacturer: string
    model: string
    year: string
    usageHours: string
    rating: string
    forSale: boolean
    desiredPrice: string
    forPurchase: boolean
    purchasePrice: string
    attachments?: {
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
  }
  images?: string[]
}

export default async function FarmerDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [farmer, setFarmer] = useState<Farmer | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', params.id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setFarmer({ id: docSnap.id, ...docSnap.data() } as Farmer)
        } else {
          alert('농민 정보를 찾을 수 없습니다.')
          router.push('/farmers')
        }
      } catch (error) {
        console.error('Error fetching farmer:', error)
        alert('농민 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmer()
  }, [params.id, router])

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteDoc(doc(db, 'farmers', params.id))
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
      const storageRef = ref(storage, `farmers/${params.id}/${category}/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)

      const docRef = doc(db, 'farmers', params.id)
      const images = farmer?.images || []
      await updateDoc(docRef, {
        images: [...images, downloadURL]
      })

      setFarmer(prev => ({
        ...prev!,
        images: [...(prev?.images || []), downloadURL]
      }))

      alert('이미지가 업로드되었습니다.')
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8">로딩중...</div>
  if (!farmer) return null

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">농민 상세 정보</h1>
      
      {/* 기본 정보 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        <div className="space-y-2">
          <p><span className="font-semibold">이름:</span> {farmer.name}</p>
          <p><span className="font-semibold">연령대:</span> {farmer.ageGroup}</p>
          <p><span className="font-semibold">전화번호:</span> {farmer.phone}</p>
          <div>
            <span className="font-semibold">주소:</span>
            <p>{farmer.address}</p>
          </div>
        </div>
      </div>

      {/* 농민 사진 */}
      {farmer.images && farmer.images.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">농민 사진</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {farmer.images.map((url, index) => (
              <div key={index} className="relative">
                <Image
                  src={url}
                  alt={`농민 사진 ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 농업 형태 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">농업 형태</h2>
        <div className="space-y-2">
          {farmer.mainCrop === '논농사' && <p>논농사</p>}
          {farmer.mainCrop === '밭농사' && <p>밭농사</p>}
          {farmer.mainCrop === '축산업' && <p>축산업</p>}
          {farmer.mainCrop === '과수원' && <p>과수원</p>}
          {farmer.mainCrop === '조사료' && <p>조사료</p>}
        </div>
      </div>

      {/* 주요 작물 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">주요 작물</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">식량작물</h3>
            <div className="space-y-1">
              {farmer.mainCrop === '벼' && <p>벼</p>}
              {farmer.mainCrop === '보리' && <p>보리</p>}
              {farmer.mainCrop === '콩' && <p>콩</p>}
              {farmer.mainCrop === '수수' && <p>수수</p>}
              {farmer.mainCrop === '고구마' && <p>고구마</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">과수</h3>
            <div className="space-y-1">
              {farmer.mainCrop === '배' && <p>배</p>}
              {farmer.mainCrop === '감' && <p>감</p>}
              {farmer.mainCrop === '자두' && <p>자두</p>}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">축산</h3>
            <div className="space-y-1">
              {farmer.mainCrop === '한우' && <p>한우</p>}
              {farmer.mainCrop === '염소' && <p>염소</p>}
            </div>
          </div>
          
          {farmer.mainCrop === '기타 작물' && (
            <div>
              <h3 className="font-medium mb-2">기타</h3>
              <p>기타 작물</p>
            </div>
          )}
        </div>
      </div>

      {/* 농기계 정보 */}
      {farmer.equipment && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">농기계 정보</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">본기 정보</h3>
              <div className="space-y-2">
                <p><span className="font-semibold">종류:</span> {farmer.equipment.type}</p>
                <p><span className="font-semibold">제조사:</span> {farmer.equipment.manufacturer}</p>
                <p><span className="font-semibold">모델:</span> {farmer.equipment.model}</p>
                <p><span className="font-semibold">연식:</span> {farmer.equipment.year}</p>
                <p><span className="font-semibold">사용시간:</span> {farmer.equipment.usageHours}시간</p>
                <p><span className="font-semibold">상태:</span> {farmer.equipment.rating}점</p>
                {farmer.equipment.forSale && (
                  <>
                    <p><span className="font-semibold">판매여부:</span> 판매희망</p>
                    <p><span className="font-semibold">판매희망가격:</span> {farmer.equipment.desiredPrice}원</p>
                  </>
                )}
                {farmer.equipment.forPurchase && (
                  <>
                    <p><span className="font-semibold">구입여부:</span> 구입희망</p>
                    <p><span className="font-semibold">구입희망가격:</span> {farmer.equipment.purchasePrice}원</p>
                  </>
                )}
              </div>
            </div>

            {/* 본기 사진 */}
            {farmer.images && farmer.images.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">본기 사진</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {farmer.images.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url}
                        alt={`본기 사진 ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 작업기 정보 - 트랙터 */}
            {farmer.equipment.type === '트랙터' && farmer.equipment.attachments && (
              <div className="space-y-4">
                {/* 로더 */}
                {farmer.equipment.attachments.loader && (
                  <div>
                    <h3 className="font-medium mb-2">로더</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">제조사:</span> {farmer.equipment.attachments.loader}</p>
                      <p><span className="font-semibold">모델:</span> {farmer.equipment.attachments.loaderModel}</p>
                      <p><span className="font-semibold">상태:</span> {farmer.equipment.attachments.loaderRating}점</p>
                    </div>
                  </div>
                )}

                {/* 로타리 */}
                {farmer.equipment.attachments.rotary && (
                  <div>
                    <h3 className="font-medium mb-2">로타리</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">제조사:</span> {farmer.equipment.attachments.rotary}</p>
                      <p><span className="font-semibold">모델:</span> {farmer.equipment.attachments.rotaryModel}</p>
                      <p><span className="font-semibold">상태:</span> {farmer.equipment.attachments.rotaryRating}점</p>
                    </div>
                  </div>
                )}

                {/* 전륜 */}
                {farmer.equipment.attachments.frontWheel && (
                  <div>
                    <h3 className="font-medium mb-2">전륜</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">제조사:</span> {farmer.equipment.attachments.frontWheel}</p>
                      <p><span className="font-semibold">모델:</span> {farmer.equipment.attachments.frontWheelModel}</p>
                      <p><span className="font-semibold">상태:</span> {farmer.equipment.attachments.frontWheelRating}점</p>
                    </div>
                  </div>
                )}

                {/* 후륜 */}
                {farmer.equipment.attachments.rearWheel && (
                  <div>
                    <h3 className="font-medium mb-2">후륜</h3>
                    <div className="space-y-2">
                      <p><span className="font-semibold">제조사:</span> {farmer.equipment.attachments.rearWheel}</p>
                      <p><span className="font-semibold">모델:</span> {farmer.equipment.attachments.rearWheelModel}</p>
                      <p><span className="font-semibold">상태:</span> {farmer.equipment.attachments.rearWheelRating}점</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 작업기 정보 - 콤바인 */}
            {farmer.equipment.type === '콤바인' && farmer.equipment.attachments && (
              <div>
                <h3 className="font-medium mb-2">예취부</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">규격:</span> {farmer.equipment.attachments.cutter}</p>
                </div>
              </div>
            )}

            {/* 작업기 정보 - 이앙기 */}
            {farmer.equipment.type === '이앙기' && farmer.equipment.attachments && (
              <div>
                <h3 className="font-medium mb-2">작업열</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">규격:</span> {farmer.equipment.attachments.rows}</p>
                </div>
              </div>
            )}

            {/* 작업기 정보 - 지게차 */}
            {farmer.equipment.type === '지게차' && farmer.equipment.attachments && (
              <div>
                <h3 className="font-medium mb-2">톤수</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">규격:</span> {farmer.equipment.attachments.tonnage}</p>
                </div>
              </div>
            )}

            {/* 작업기 정보 - 굴삭기 */}
            {farmer.equipment.type === '굴삭기' && farmer.equipment.attachments && (
              <div>
                <h3 className="font-medium mb-2">규격</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">규격:</span> {farmer.equipment.attachments.size}</p>
                </div>
              </div>
            )}

            {/* 작업기 정보 - 스키로더 */}
            {farmer.equipment.type === '스키로더' && farmer.equipment.attachments && (
              <div>
                <h3 className="font-medium mb-2">버켓용량</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold">규격:</span> {farmer.equipment.attachments.bucketSize}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메모 */}
      {farmer.memo && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">메모</h2>
          <p className="whitespace-pre-wrap">{farmer.memo}</p>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Link
          href={`/farmers/${params.id}/edit`}
          className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          수정하기
        </Link>
        <Link
          href="/"
          className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          목록으로
        </Link>
      </div>
    </div>
  )
} 