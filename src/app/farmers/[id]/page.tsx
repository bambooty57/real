import { Suspense } from 'react'
import FarmerDetailClient from './FarmerDetailClient'

export default async function FarmerDetail({ params }: { params: { id: string } }) {
  const farmerId = await Promise.resolve(params.id)

  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-center">데이터를 불러오는 중...</div>}>
      <FarmerDetailClient id={farmerId} />
    </Suspense>
  )
} 