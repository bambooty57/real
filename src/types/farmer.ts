export interface Equipment {
  id: string
  type: string
  manufacturer: string
  horsepower: string
  model: string
  year: string
  usageHours: string
  rating: string
  condition: number
  images?: string[]
  attachments: {
    loader?: {
      model?: string
      rating?: string
      condition?: number
      memo?: string
    }
    rotary?: {
      model?: string
      rating?: string
      condition?: number
      memo?: string
    }
    frontWheel?: {
      model?: string
      rating?: string
      condition?: number
      memo?: string
    }
    rearWheel?: {
      model?: string
      rating?: string
      condition?: number
      memo?: string
    }
    cutter?: string
    rows?: string
    tonnage?: string
    size?: string
    bucketSize?: string
  }
  saleType?: 'new' | 'used' | null
  tradeType?: string
  saleStatus?: string
  purchaseStatus?: string
  desiredPrice?: string
  purchasePrice?: string
  memo?: string
  forSale?: boolean
  forPurchase?: boolean
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