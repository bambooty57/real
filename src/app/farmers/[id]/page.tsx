'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import Image from 'next/image'

interface Farmer {
  id: string
  name: string
  address: string
  phone: string
  ageGroup: string
  mainCrop: string
  equipment: {
    type: string
    manufacturer: string
    attachments?: {
      loader: string
      rotary: string
      wheels: string
    }
  }
  images?: string[]
}

export default function FarmerDetail({ params }: { params: { id: string } }) {
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{farmer.name} 상세 정보</h1>
        <div className="space-x-2">
          <button
            onClick={() => router.push(`/farmers/${farmer.id}/edit`)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            수정
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="text-gray-600">이름</label>
                <p className="text-lg">{farmer.name}</p>
              </div>
              <div>
                <label className="text-gray-600">주소</label>
                <p className="text-lg">{farmer.address}</p>
              </div>
              <div>
                <label className="text-gray-600">전화번호</label>
                <p className="text-lg">{farmer.phone}</p>
              </div>
              <div>
                <label className="text-gray-600">연령대</label>
                <p className="text-lg">{farmer.ageGroup}</p>
              </div>
              <div>
                <label className="text-gray-600">주요 농작물</label>
                <p className="text-lg">{farmer.mainCrop}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">농기계 정보</h2>
            <div className="space-y-3">
              <div>
                <label className="text-gray-600">종류</label>
                <p className="text-lg">{farmer.equipment.type}</p>
              </div>
              <div>
                <label className="text-gray-600">제조사</label>
                <p className="text-lg">{farmer.equipment.manufacturer}</p>
              </div>
              {farmer.equipment.type === '트랙터' && farmer.equipment.attachments && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">작업기 정보</h3>
                  <div>
                    <label className="text-gray-600">로더</label>
                    <p>{farmer.equipment.attachments.loader}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">로터리</label>
                    <p>{farmer.equipment.attachments.rotary}</p>
                  </div>
                  <div>
                    <label className="text-gray-600">바퀴</label>
                    <p>{farmer.equipment.attachments.wheels}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">사진</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">기본 사진 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'basic')}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              <div>
                <label className="block mb-2">장비 사진 업로드</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'equipment')}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>

            {farmer.images && farmer.images.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">업로드된 사진</h3>
                <div className="grid grid-cols-2 gap-4">
                  {farmer.images.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={url}
                        alt={`Farmer image ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          뒤로가기
        </button>
      </div>
    </div>
  )
} 