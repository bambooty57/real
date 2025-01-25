import { FarmingTypes, MainCrop } from '@/types/farmer'

// 농기계 타입 매핑
const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'rice_transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skid_loader': '스키로더',
  'dryer': '건조기',
  'silo': '싸일론',
  'claas': '클라스',
  'drone': '드론'
};

// 제조사 매핑
export const getKoreanManufacturer = (manufacturer: string): string => {
  const manufacturerMap: { [key: string]: string } = {
    'john_deere': '존디어',
    'kubota': '구보다',
    'daedong': '대동',
    'kukje': '국제',
    'ls': '엘에스',
    'yanmar': '얀마',
    'newholland': '뉴홀랜드',
    'mf': '엠에프',
    'case': '케이스',
    'hyundai': '현대',
    'samsung': '삼성',
    'volvo': '볼보',
    'hitachi': '히타치',
    'doosan': '두산',
    'agrico': '아그리코',
    'star': '스타',
    'chevrolet': '시보레',
    'valmet': '발메트'
  };
  return manufacturerMap[manufacturer] || manufacturer;
};

// 작업기 한글명 매핑
export const getAttachmentDisplayName = (key: string): string => {
  const attachmentDisplayNames: { [key: string]: string } = {
    loader: '로더',
    rotary: '로타리',
    frontWheel: '전륜',
    rearWheel: '후륜',
    cutter: '커터',
    rows: '열수',
    tonnage: '톤수',
    size: '규격',
    bucketSize: '버켓용량'
  };
  return attachmentDisplayNames[key] || key;
};

// 영농형태 한글명 매핑
const farmingTypeDisplayNames: { [key: string]: string } = {
  paddyFarming: '논농사',
  fieldFarming: '밭농사',
  livestock: '축산',
  orchard: '과수원',
  forageCrop: '사료작물'
};

// 작물 한글명 매핑
const cropDisplayNames: { [key: string]: string } = {
  rice: '벼',
  sweetPotato: '고구마',
  persimmon: '감',
  barley: '보리',
  other: '기타',
  sorghum: '수수',
  pear: '배',
  soybean: '콩',
  goat: '염소',
  hanwoo: '한우',
  plum: '자두'
};

export const getFarmingTypeDisplay = (farmingTypes: FarmingTypes): string => {
  if (!farmingTypes) return ''
  
  const types = Object.entries(farmingTypes)
    .filter(([_, value]) => value === true)
    .map(([key]) => farmingTypeDisplayNames[key] || key)
  
  return types.join(', ') || '없음'
}

export const getMainCropDisplay = (mainCrop: MainCrop): string => {
  if (!mainCrop) return ''
  
  if (typeof mainCrop === 'string') return mainCrop
  
  const crops = Object.entries(mainCrop)
    .filter(([_, value]) => value === true)
    .map(([key]) => cropDisplayNames[key] || key)
  
  return crops.join(', ') || '없음'
}

export const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
} 