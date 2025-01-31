export interface Equipment {
  id: string;
  type: string;
  manufacturer: string;
  model: string;
  horsepower: string;
  year: string;
  usageHours: string;
  condition?: number;
  rating?: number;
  saleType: 'new' | 'used' | null;
  tradeType: string;
  desiredPrice: string;
  saleStatus: string;
  images?: (string | File)[];
  
  // 이앙기 관련
  rows?: string;
  transplanterType?: 'riding' | 'walking';
  seedlingCapacity?: string;
  hasFertilizer?: boolean;
  hasSideFertilizer?: boolean;

  // 콤바인 관련
  cuttingType?: 'binding' | 'spreading';
  threshingType?: 'axial' | 'mixed';
  grainTankCapacity?: string;

  // 지게차 관련
  maxLiftHeight?: string;
  maxLoadWeight?: string;
  mastType?: '2stage' | '3stage' | '4stage';
  tireType?: 'solid' | 'pneumatic';
  hasSideShift?: boolean;
  
  attachments?: Array<{
    type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel';
    manufacturer: string;
    model: string;
    condition?: number;
    memo?: string;
    images?: (string | File)[];
  }>;
  
  memo?: string;
}

export interface AttachmentImages {
  loader?: string[];
  rotary?: string[];
  frontWheel?: string[];
  rearWheel?: string[];
  cutter?: string[];
  rows?: string[];
  tonnage?: string[];
  size?: string[];
  bucketSize?: string[];
}

export type MainCropType = 'foodCrops' | 'facilityHort' | 'fieldVeg' | 'fruits' | 'specialCrops' | 'flowers' | 'livestock';

export interface MainCrop extends Record<MainCropType, boolean | undefined> {
  foodCropsDetails?: string[];
  facilityHortDetails?: string[];
  fieldVegDetails?: string[];
  fruitsDetails?: string[];
  specialCropsDetails?: string[];
  flowersDetails?: string[];
  livestockDetails?: string[];
  [key: string]: boolean | string[] | undefined;
}

export interface FarmingTypes {
  waterPaddy: boolean;    // 수도작
  fieldFarming: boolean;  // 밭농사
  livestock: boolean;     // 축산업
  orchard: boolean;       // 과수원
  forageCrop: boolean;    // 사료작물
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  businessName?: string;
  postalCode?: string;
  zipCode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  addressDetail?: string;
  canReceiveMail: boolean;
  ageGroup?: string;
  memo?: string;
  farmingMemo?: string;  // 영농정보메모
  farmerImages: string[];
  mainCrop: MainCrop;
  farmingTypes: FarmingTypes;
  equipments: Equipment[];
  rating?: number;
}

export interface Attachment {
  id: string;
  type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel';
  manufacturer: string;
  model: string;
  condition?: number;
  memo?: string;
  images?: (string | File)[];
}

export interface FormData extends Omit<Farmer, 'id'> {
  id?: string;
}
