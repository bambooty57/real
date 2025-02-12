'use client'

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'react-hot-toast'
import { FormData } from '@/types/farmer'
import { useRouter } from 'next/navigation'
import NewFarmer from '@/app/farmers/new/NewFarmer'

interface EditFarmerClientProps {
  farmerId: string
  initialData: FormData
  onClose: () => void
  onUpdate: () => void
}

export default function EditFarmerClient({ farmerId, initialData, onClose, onUpdate }: EditFarmerClientProps) {
  const router = useRouter()

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
      router.push('/farmers')
    } catch (error) {
      console.error('Error updating farmer:', error)
      toast.error('농민 정보 수정 중 오류가 발생했습니다.')
    }
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