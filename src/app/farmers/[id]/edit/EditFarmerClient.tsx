'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import NewFarmer from '../../new/NewFarmer'
import { toast } from 'react-hot-toast'
import { FormData } from '@/types/farmer'
import { useRouter } from 'next/navigation'

interface EditFarmerClientProps {
  farmerId: string
  onClose: () => void
  onUpdate?: () => void
}

export default function EditFarmerClient({ farmerId, onClose, onUpdate }: EditFarmerClientProps) {
  const [initialData, setInitialData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchFarmer = async () => {
      try {
        const docRef = doc(db, 'farmers', farmerId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data() as FormData
          setInitialData(data)
        } else {
          setError('농민 정보를 찾을 수 없습니다.')
        }
      } catch (err) {
        console.error('Error fetching farmer data:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchFarmer()
  }, [farmerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const docRef = doc(db, 'farmers', farmerId)
      await updateDoc(docRef, {
        ...initialData,
        updatedAt: serverTimestamp()
      })
      toast.success('농민 정보가 수정되었습니다.')
      if (onUpdate) {
        onUpdate()
      }
      router.push('/farmers')
    } catch (error) {
      console.error('Error updating farmer:', error)
      toast.error('농민 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse text-center">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return (
    <div className="bg-white">
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