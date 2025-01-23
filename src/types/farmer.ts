export interface Equipment {
  id: string
  type: string
  manufacturer: string
  model?: string
  year?: string
  usageHours?: string
  rating?: string
  memo?: string
  forSale?: boolean
  forPurchase?: boolean
  saleType?: 'new' | 'used'
  desiredPrice?: string
  purchasePrice?: string
  saleStatus?: string
  saleDate?: string
  purchaseStatus?: string
  purchaseDate?: string
  images?: string[]
  attachments?: {
    loader?: string
    loaderModel?: string
    loaderRating?: string
    loaderImages?: string[]
    rotary?: string
    rotaryModel?: string
    rotaryRating?: string
    rotaryImages?: string[]
    frontWheel?: string
    frontWheelModel?: string
    frontWheelRating?: string
    frontWheelImages?: string[]
    rearWheel?: string
    rearWheelModel?: string
    rearWheelRating?: string
    rearWheelImages?: string[]
    rows?: string
    rowsModel?: string
    rowsRating?: string
    tonnage?: string
    tonnageModel?: string
    tonnageRating?: string
  }
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
  [key: string]: boolean;
  rice?: boolean;
  barley?: boolean;
  hanwoo?: boolean;
  soybean?: boolean;
  sweetPotato?: boolean;
  persimmon?: boolean;
  pear?: boolean;
  plum?: boolean;
  sorghum?: boolean;
  goat?: boolean;
  other?: boolean;
}

export interface FarmingTypes {
  paddyFarming: boolean
  fieldFarming: boolean
  livestock: boolean
  orchard: boolean
  forageCrop: boolean
}

export interface Farmer {
  id: string
  name: string
  businessName?: string
  companyName?: string
  zipCode: string
  roadAddress: string
  jibunAddress: string
  addressDetail?: string
  phone: string
  ageGroup: string
  memo?: string
  canReceiveMail: boolean
  mainCrop: MainCrop
  farmingTypes: FarmingTypes
  equipments: Equipment[]
  farmerImages?: string[]
  mainImages?: string[]
  attachmentImages?: AttachmentImages
} 