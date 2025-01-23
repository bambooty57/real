'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import NewFarmer from '../../new/NewFarmer'

const defaultFormData = {
  name: '',
  companyName: '',
  zipCode: '',
  roadAddress: '',
  jibunAddress: '',
  addressDetail: '',
  canReceiveMail: false,
  phone: '',
  ageGroup: '',
  memo: '',
  mainImages: [],
  attachmentImages: {
    loader: [],
    rotary: [],
    frontWheel: [],
    rearWheel: [],
    cutter: [],
    rows: [],
    tonnage: [],
    size: [],
    bucketSize: []
  },
  mainCrop: {
    rice: false,
    barley: false,
    hanwoo: false,
    soybean: false,
    sweetPotato: false,
    persimmon: false,
    pear: false,
    plum: false,
    sorghum: false,
    goat: false,
    other: false
  },
  farmingTypes: {
    paddyFarming: false,
    fieldFarming: false,
    orchard: false,
    livestock: false,
    forageCrop: false,
  },
  equipments: []
}

interface EditFarmerClientProps {
  farmerId: string
}

export default function EditFarmerClient({ farmerId }: EditFarmerClientProps) {
  const [initialData, setInitialData] = useState<any>(defaultFormData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFarmerData() {
      try {
        const docRef = doc(db, 'farmers', farmerId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setInitialData({
            ...defaultFormData,
            ...data,
            equipments: (data.equipments || []).map((equipment: any) => ({
              ...equipment,
              images: equipment.images || [],
              attachments: {
                ...equipment.attachments,
                loaderImages: equipment.attachments?.loaderImages || [],
                rotaryImages: equipment.attachments?.rotaryImages || [],
                frontWheelImages: equipment.attachments?.frontWheelImages || [],
                rearWheelImages: equipment.attachments?.rearWheelImages || []
              }
            }))
          })
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

  if (loading) {
    return <div>데이터를 불러오는 중...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return <NewFarmer mode="edit" farmerId={farmerId} initialData={initialData} />
} 