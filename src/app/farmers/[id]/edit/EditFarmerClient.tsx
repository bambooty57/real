'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'react-hot-toast'
import NewFarmer from '@/app/farmers/new/NewFarmer'
import { FormData } from '@/types/farmer'

interface EditFarmerClientProps {
  farmerId: string
  onClose: () => void
  onUpdate: () => void
}

export default function EditFarmerClient({ farmerId, onClose, onUpdate }: EditFarmerClientProps) {
  const [initialData, setInitialData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchFarmerData() {
      try {
        const docRef = doc(db, 'farmers', farmerId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data() as FormData
          setInitialData({
            ...data,
            id: docSnap.id
          })
        } else {
          setError('농민 정보를 찾을 수 없습니다.')
          toast.error('농민 정보를 찾을 수 없습니다.')
        }
      } catch (err) {
        console.error('Error fetching farmer data:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmerData()
  }, [farmerId])

  const handleSubmit = async (data: FormData) => {
    try {
      const docRef = doc(db, 'farmers', farmerId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
      
      toast.success('농민 정보가 수정되었습니다.')
      onUpdate()
      onClose()
      
      // 라우팅 방식 수정
      router.push({
        pathname: '/farmers',
        query: { updated: 'true' }
      }, undefined, { shallow: true })
    } catch (error) {
      console.error('Error updating farmer:', error)
      toast.error('농민 정보 수정 중 오류가 발생했습니다.')
      // 에러 발생 시 이전 페이지로 복귀하지 않고 현재 페이지 유지
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">데이터를 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">오류 발생!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">알림:</strong>
          <span className="block sm:inline"> 데이터를 찾을 수 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-4">
      <NewFarmer 
        mode="edit"
        farmerId={farmerId}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </div>
  )
} 