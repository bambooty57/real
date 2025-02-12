'use client';

import React, { useState } from 'react';
import { Farmer } from '@/types/farmer';
import FarmerCard from '../FarmerCard';
import FarmerDetailModal from '@/components/FarmerDetailModal';

interface FarmerListProps {
  farmers: Farmer[];
  onSelect: (id: string, checked: boolean) => void;
  selectedFarmers: string[];
}

export default function FarmerList({ farmers, onSelect, selectedFarmers }: FarmerListProps) {
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetail = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farmers.map((farmer) => (
          <FarmerCard
            key={farmer.id}
            farmer={farmer}
            onSelect={onSelect}
            isSelected={selectedFarmers.includes(farmer.id)}
            onViewDetail={handleViewDetail}
          />
        ))}
      </div>

      {selectedFarmer && (
        <FarmerDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFarmer(null);
          }}
          farmer={selectedFarmer}
        />
      )}
    </>
  );
} 