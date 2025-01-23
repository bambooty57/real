import { Suspense } from 'react'
import { Metadata } from 'next'
import FarmerDetailClient from './FarmerDetailClient'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `농부 상세 정보 - ${params.id}`,
  }
}

export default async function Page({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-center">데이터를 불러오는 중...</div>}>
      <FarmerDetailClient farmerId={params.id} />
    </Suspense>
  )
} 