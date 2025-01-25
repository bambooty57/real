'use client'

import NewFarmer from './NewFarmer';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{}>;
}

export default function NewFarmerPage({ params, searchParams }: PageProps) {
  return <NewFarmer />;
} 