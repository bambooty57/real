'use client';

import React, { useState } from 'react';
import { Farmer } from '@/types/farmer';
import FarmerCard from '../FarmerCard';
import FarmerDetailModal from '@/components/FarmerDetailModal';

interface FarmerListProps {
  farmers: Farmer[];
  selectedFarmers: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectFarmer: (farmerId: string, checked: boolean) => void;
  onDelete: (farmerId: string) => Promise<void>;
  onView: (farmer: Farmer) => void;
}

export default function FarmerList({ 
  farmers, 
  selectedFarmers, 
  onSelectAll,
  onSelectFarmer,
  onDelete,
  onView 
}: FarmerListProps) {
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetail = (farmer: Farmer) => {
    onView(farmer);
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
            onSelect={onSelectFarmer}
            isSelected={selectedFarmers.includes(farmer.id)}
            onViewDetail={handleViewDetail}
            onDelete={onDelete}
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