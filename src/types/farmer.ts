export interface Equipment {
  id: string
  type: string
  manufacturer: string
  model: string
  horsepower: string
  year: string
  usageHours: string
  condition?: number
  rating?: number
  forSale?: boolean
  forPurchase?: boolean
  attachments?: Array<{
    type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel'
    manufacturer: string
    model: string
    condition?: number
    memo?: string
    images?: string[]
  }>
  saleType?: string
  tradeType?: string
  saleStatus?: string
  purchaseStatus?: string
  desiredPrice?: string
  memo?: string
  images?: string[]
  
  // 거래 정보
  saleType: 'new' | 'used' | null
  tradeType: string
  desiredPrice: string
  saleStatus: string
  
  // 트랙터 관련
  
  // 이앙기 관련
  rows?: string
  transplanterType?: 'riding' | 'walking'
  seedlingCapacity?: string
  hasFertilizer?: boolean
  hasSideFertilizer?: boolean
  
  // 콤바인 관련
  cuttingType?: 'binding' | 'spreading'
  threshingType?: 'axial' | 'mixed'
  grainTankCapacity?: string
  
  // 지게차 관련
  maxLiftHeight?: string
  maxLoadWeight?: string
  mastType?: '2stage' | '3stage' | '4stage'
  tireType?: 'solid' | 'pneumatic'
  hasSideShift?: boolean
}

export interface AttachmentImages {
  loader?: string[]
  rotary?: string[]
  frontWheel?: string[]
  rearWheel?: string[]
  cutter?: string[]
  rows?: string[]
  tonnage?: string[]
  size?: string[]
  bucketSize?: string[]
}

export interface MainCrop {
  rice: boolean;
  barley: boolean;
  hanwoo: boolean;
  soybean: boolean;
  sweetPotato: boolean;
  persimmon: boolean;
  pear: boolean;
  plum: boolean;
  sorghum: boolean;
  goat: boolean;
  other: boolean;
}

export interface FarmingTypes {
  paddyFarming: boolean
  fieldFarming: boolean
  livestock: boolean
  orchard: boolean
  forageCrop: boolean
}

export interface Farmer {
  id?: string
  name: string
  businessName?: string
  zipCode: string
  roadAddress: string
  jibunAddress: string
  addressDetail?: string
  canReceiveMail: boolean
  phone: string
  ageGroup: string
  memo?: string
  farmerImages: string[]
  mainImages: string[]
  attachmentImages: {
    loader: string[]
    rotary: string[]
    frontWheel: string[]
    rearWheel: string[]
  }
  mainCrop: {
    rice: boolean
    barley: boolean
    hanwoo: boolean
    soybean: boolean
    sweetPotato: boolean
    persimmon: boolean
    pear: boolean
    plum: boolean
    sorghum: boolean
    goat: boolean
    other: boolean
  }
  farmingTypes: FarmingTypes
  equipments: Equipment[]
}

export interface Attachment {
  id: string;
  type: 'loader' | 'rotary' | 'frontWheel' | 'rearWheel';
  manufacturer: string;
  model: string;
  condition?: number;
  memo?: string;
  images?: (File | string | null)[];
}

export interface FormData {
  name: string;
  businessName: string;
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail: string;
  canReceiveMail: boolean;
  phone: string;
  ageGroup: string;
  memo: string;
  farmerImages: string[];
  mainCrop: {
    rice: boolean;
    barley: boolean;
    hanwoo: boolean;
    soybean: boolean;
    sweetPotato: boolean;
    persimmon: boolean;
    pear: boolean;
    plum: boolean;
    sorghum: boolean;
    goat: boolean;
    other: boolean;
  };
  farmingTypes: {
    paddyFarming: boolean;
    fieldFarming: boolean;
    orchard: boolean;
    livestock: boolean;
    forageCrop: boolean;
  };
  equipments: Equipment[];
  rating: number;
} 