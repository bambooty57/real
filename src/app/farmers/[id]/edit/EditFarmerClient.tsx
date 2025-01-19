'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import NewFarmer from '../../new/page'

const defaultFormData = {
  name: '',
  zipCode: '',
  address: '',
  addressDetail: '',
  phone: '',
  ageGroup: '',
  memo: '',
  farmerImages: [],
  paddyFarming: false,
  fieldFarming: false,
  facilityFarming: false,
  livestock: false,
  fruitFarming: false,
  equipments: []
}

interface EditFarmerClientProps {
  farmerId: string
}

export default function EditFarmerClient({ farmerId }: EditFarmerClientProps) {
  const [initialData, setInitialData] = useState<any>(defaultFormData)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'farmers', farmerId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setInitialData({
            ...defaultFormData,
            ...data,
            equipments: data.equipments?.map((equipment: any) => ({
              ...equipment,
              images: equipment.images || [],
              attachments: {
                ...equipment.attachments,
                loaderImages: equipment.attachments?.loaderImages || [],
                rotaryImages: equipment.attachments?.rotaryImages || [],
                frontWheelImages: equipment.attachments?.frontWheelImages || [],
                rearWheelImages: equipment.attachments?.rearWheelImages || []
              }
            })) || []
          })
        }
      } catch (error) {
        console.error('Error fetching farmer data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [farmerId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!initialData) {
    return <div>농민 정보를 찾을 수 없습니다.</div>
  }

  return <NewFarmer mode="edit" farmerId={farmerId} initialData={initialData} />
} 