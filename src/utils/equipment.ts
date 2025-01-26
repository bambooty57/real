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
  images: [],
  saleType: null,
  tradeType: '',
  desiredPrice: '',
  saleStatus: '',
  forSale: false,
  forPurchase: false,
  attachments: []
});

export const createInitialAttachment = (type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel') => ({
  id: uuidv4(),
  type,
  manufacturer: '',
  model: '',
  condition: 0,
  memo: '',
  images: []
}); 