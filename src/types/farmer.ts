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

export interface MainCrop {
  foodCrops?: boolean;
  facilityHort?: boolean;
  fieldVeg?: boolean;
  fruits?: boolean;
  specialCrops?: boolean;
  flowers?: boolean;
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
  zipCode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  addressDetail?: string;
  canReceiveMail: boolean;
  ageGroup?: string;
  memo?: string;
  farmerImages: string[];
  mainCrop: {
    foodCrops?: boolean;
    facilityHort?: boolean;
    fieldVeg?: boolean;
    fruits?: boolean;
    specialCrops?: boolean;
    flowers?: boolean;
    [key: string]: boolean | undefined;
  };
  farmingTypes: {
    waterPaddy: boolean;
    fieldFarming: boolean;
    orchard: boolean;
    livestock: boolean;
    forageCrop: boolean;
  };
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
  images?: (string | File | null)[];
}

export interface FormData extends Omit<Farmer, 'id'> {
  id?: string;
}
