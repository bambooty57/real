// 농기계 타입 매핑
export const getKoreanEquipmentType = (type: string): string => {
  const equipmentTypeMap: { [key: string]: string } = {
    'tractor': '트랙터',
    'combine': '콤바인',
    'rice_transplanter': '이앙기',
    'forklift': '지게차',
    'excavator': '굴삭기',
    'skid_loader': '스키로더'
  };
  return equipmentTypeMap[type] || type;
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
    'claas': '클라스',
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

// 작물 한글명 매핑
export const getMainCropDisplay = (crops: { [key: string]: boolean }): string => {
  const cropDisplayNames: { [key: string]: string } = {
    rice: '벼',
    barley: '보리',
    hanwoo: '한우',
    soybean: '콩',
    sweetPotato: '고구마',
    persimmon: '감',
    pear: '배',
    plum: '자두',
    sorghum: '수수',
    goat: '염소',
    other: '기타'
  };

  return Object.entries(crops)
    .filter(([_, value]) => value)
    .map(([key, _]) => cropDisplayNames[key] || key)
    .join(', ');
};

// 농업 형태 한글명 매핑
export const getFarmingTypeDisplay = (types: { [key: string]: boolean }): string => {
  const farmingTypeDisplayNames: { [key: string]: string } = {
    paddyFarming: '논농사',
    fieldFarming: '밭농사',
    livestock: '축산',
    orchard: '과수원',
    forageCrop: '조사료'
  };

  return Object.entries(types)
    .filter(([_, value]) => value)
    .map(([key, _]) => farmingTypeDisplayNames[key] || key)
    .join(', ');
}; 