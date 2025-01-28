'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchFilterState {
  searchTerm: string;
  selectedCity: string;
  selectedDistrict: string;
  selectedVillage: string;
  selectedFarmingType: string;
  selectedMainCrop: string;
  selectedMailOption: string;
  selectedSaleType: string;
  selectedEquipmentType: string;
  selectedManufacturer: string;
}

interface SearchFilterContextType {
  filterState: SearchFilterState;
  setFilterState: React.Dispatch<React.SetStateAction<SearchFilterState>>;
}

const initialState: SearchFilterState = {
  searchTerm: '',
  selectedCity: '',
  selectedDistrict: '',
  selectedVillage: '',
  selectedFarmingType: '',
  selectedMainCrop: '',
  selectedMailOption: 'all',
  selectedSaleType: 'all',
  selectedEquipmentType: '',
  selectedManufacturer: ''
};

const SearchFilterContext = createContext<SearchFilterContextType | undefined>(undefined);

export function SearchFilterProvider({ children }: { children: ReactNode }) {
  const [filterState, setFilterState] = useState<SearchFilterState>(initialState);

  return (
    <SearchFilterContext.Provider value={{ filterState, setFilterState }}>
      {children}
    </SearchFilterContext.Provider>
  );
}

export function useSearchFilter() {
  const context = useContext(SearchFilterContext);
  if (context === undefined) {
    throw new Error('useSearchFilter must be used within a SearchFilterProvider');
  }
  return context;
} 