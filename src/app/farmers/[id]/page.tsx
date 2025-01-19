import { Suspense } from 'react'
import FarmerDetailClient from './FarmerDetailClient'

export default function FarmerDetail({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-center">데이터를 불러오는 중...</div>}>
      <FarmerDetailClient id={params.id} />
    </Suspense>
  )
} 