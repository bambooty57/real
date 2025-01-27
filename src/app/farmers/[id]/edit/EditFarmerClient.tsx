'use client'

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import NewFarmer from '../../new/NewFarmer'

interface EditFarmerClientProps {
  farmerId: string
}

export default function EditFarmerClient({ farmerId }: EditFarmerClientProps) {
  const [initialData, setInitialData] = useState<any>({
    name: '',
    businessName: '',
    zipCode: '',
    roadAddress: '',
    jibunAddress: '',
    addressDetail: '',
    canReceiveMail: false,
    phone: '',
    ageGroup: '',
    memo: '',
    farmerImages: [],
    mainCrop: {},
    farmingTypes: {
      waterPaddy: false,
      fieldFarming: false,
      livestock: false,
      orchard: false,
      forageCrop: false
    },
    equipments: [],
    rating: 0
  })
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
            id: docSnap.id,
            name: data.name || '',
            phone: data.phone || '',
            businessName: data.businessName || '',
            zipCode: data.zipCode || '',
            roadAddress: data.roadAddress || '',
            jibunAddress: data.jibunAddress || '',
            addressDetail: data.addressDetail || '',
            canReceiveMail: data.canReceiveMail || false,
            ageGroup: data.ageGroup || '',
            memo: data.memo || '',
            farmingMemo: data.farmingMemo || '',
            farmerImages: data.farmerImages || [],
            mainCrop: data.mainCrop || {},
            farmingTypes: {
              waterPaddy: data.farmingTypes ? data.farmingTypes.waterPaddy : false,
              fieldFarming: data.farmingTypes ? data.farmingTypes.fieldFarming : false,
              livestock: data.farmingTypes ? data.farmingTypes.livestock : false,
              orchard: data.farmingTypes ? data.farmingTypes.orchard : false,
              forageCrop: data.farmingTypes ? data.farmingTypes.forageCrop : false
            },
            equipments: (data.equipments || []).map((eq: any) => ({
              ...eq,
              type: eq.type || '',
              manufacturer: eq.manufacturer || '',
              model: eq.model || '',
              year: eq.year || '',
              usageHours: eq.usageHours || '',
              condition: eq.condition || 0,
              images: eq.images || [],
              saleType: eq.saleType || '',
              tradeType: eq.tradeType || '',
              desiredPrice: eq.desiredPrice || '',
              saleStatus: eq.saleStatus || ''
            })),
            rating: data.rating || 0
          })
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

    fetchFarmerData()
  }, [farmerId])

  if (loading) {
    return <div className="p-4">데이터를 불러오는 중...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  return <NewFarmer mode="edit" farmerId={farmerId} initialData={initialData} />
} 