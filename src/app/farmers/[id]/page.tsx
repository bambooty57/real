'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PageProps {
  params: {
    id: string;
  };
}

export default function FarmerDetailPage({ params }: PageProps) {
  const router = useRouter();
  
  useEffect(() => {
    router.push(`/farmers/${params.id}/edit`);
  }, [params.id, router]);

  return null;
} 