// 농기계 타입 매핑
export const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'rice_transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skid_loader': '스키로더'
}

// 제조사 매핑
export const manufacturerMap: { [key: string]: string } = {
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
  'claas': '클라스',
  'agrico': '아그리코',
  'star': '스타',
  'chevrolet': '시보레',
  'valmet': '발메트'
}

// 작업기 한글명 매핑
export const attachmentDisplayNames: { [key: string]: string } = {
  loader: '로더',
  rotary: '로타리',
  frontWheel: '전륜',
  rearWheel: '후륜',
  cutter: '커터',
  rows: '열수',
  tonnage: '톤수',
  size: '규격',
  bucketSize: '버켓용량'
}

// 작물 한글명 매핑
export const cropDisplayNames: { [key: string]: string } = {
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
}

// 영농형태 한글명 매핑
export const farmingTypeDisplayNames: { [key: string]: string } = {
  fieldFarming: '밭농사',
  forageCrop: '사료작물',
  livestock: '축산',
  orchard: '과수원',
  paddyFarming: '논농사'
}

// 한글 변환 함수
export const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
}

export const getKoreanManufacturer = (manufacturer: string): string => {
  return manufacturerMap[manufacturer.toLowerCase()] || manufacturer
}

// 작물 표시 함수
export const getMainCropDisplay = (mainCrop: any): string => {
  if (typeof mainCrop === 'string') return mainCrop
  
  if (typeof mainCrop === 'object') {
    const crops = Object.entries(mainCrop)
      .filter(([_, value]) => value === true)
      .map(([key]) => cropDisplayNames[key] || key)
    
    return crops.join(', ') || '없음'
  }
  
  return '없음'
}

// 영농형태 표시 함수
export const getFarmingTypeDisplay = (farmingType: any): string => {
  if (typeof farmingType === 'object') {
    const types = Object.entries(farmingType)
      .filter(([_, value]) => value === true)
      .map(([key]) => farmingTypeDisplayNames[key] || key)
    
    return types.join(', ') || '없음'
  }
  
  return '없음'
} 