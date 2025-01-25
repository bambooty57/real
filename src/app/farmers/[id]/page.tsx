import { Suspense, use } from 'react'
import { Metadata } from 'next'
import FarmerDetailClient from './FarmerDetailClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `농부 상세 정보 - ${id}`,
  }
}

export default function Page({ params }: PageProps) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-center">데이터를 불러오는 중...</div>}>
      <FarmerDetailClient farmerId={id} />
    </Suspense>
  )
} 