'use client';

import React from 'react';
import { Farmer } from '@/types/farmer';
import FarmerCard from '../FarmerCard';

interface FarmerListProps {
  farmers: Farmer[];
  onSelect: (id: string, checked: boolean) => void;
  selectedFarmers: string[];
  onViewDetail: (farmer: Farmer) => void;
}

export default function FarmerList({
  farmers,
  onSelect,
  selectedFarmers,
  onViewDetail
}: FarmerListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {farmers.map((farmer) => (
        <FarmerCard
          key={farmer.id}
          farmer={farmer}
          onSelect={onSelect}
          isSelected={selectedFarmers.includes(farmer.id)}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
} 