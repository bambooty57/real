import { v4 as uuidv4 } from 'uuid';
import { Equipment } from '@/types/farmer';

export const createInitialEquipment = (): Equipment => ({
  id: uuidv4(),
  type: '',
  manufacturer: '',
  model: '',
  horsepower: '',
  year: '',
  usageHours: '',
  condition: 0,
  rating: '',
  attachments: {
    loader: {
      model: '',
      manufacturer: '',
      condition: 0,
      rating: '',
      memo: '',
      images: []
    },
    rotary: {
      model: '',
      manufacturer: '',
      condition: 0,
      rating: '',
      memo: '',
      images: []
    },
    frontWheel: {
      model: '',
      manufacturer: '',
      condition: 0,
      rating: '',
      memo: '',
      images: []
    },
    rearWheel: {
      model: '',
      manufacturer: '',
      condition: 0,
      rating: '',
      memo: '',
      images: []
    }
  },
  saleType: null,
  tradeType: '',
  saleStatus: '',
  purchaseStatus: '',
  desiredPrice: '',
  memo: '',
  images: []
}); 