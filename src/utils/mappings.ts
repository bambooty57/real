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
  'drone': '드론',
  'cultivator': '경운기',
  'sprayer': '방제기',
  'seeder': '파종기',
  'harvester': '수확기',
  'thresher': '탈곡기'
};

// 제조사 매핑
export const getKoreanManufacturer = (manufacturer: string): string => {
  const manufacturerMap: { [key: string]: string } = {
    // 국내 제조사
    'daedong': '대동',
    'kukje': '국제',
    'ls': '엘에스',
    'dongyang': '동양',
    'asia': '아시아',
    'hyundai': '현대',
    'samsung': '삼성',
    'doosan': '두산',
    'tong_yang': '동양',
    'kumsung': '금성',
    'hansung': '한성',
    'tymnet': '티와이엠',
    'branson': '브랜슨',

    // 일본 제조사
    'yanmar': '얀마',
    'kubota': '구보다',
    'iseki': '이세키',
    'mitsubishi': '미쯔비시',
    'hinomoto': '히노모토',
    'shibaura': '시바우라',

    // 미국 제조사
    'john_deere': '존디어',
    'case': '케이스',
    'new_holland': '뉴홀랜드',
    'massey_ferguson': '매시퍼거슨',
    'agco': '아그코',
    'caterpillar': '캐터필러',
    'mccormick': '맥코믹',

    // 유럽 제조사
    'fendt': '펜트',
    'claas': '클라스',
    'deutz_fahr': '도이츠파',
    'same': '세임',
    'landini': '란디니',
    'valtra': '발트라',
    'zetor': '제토',
    'lamborghini': '람보르기니',
    'antonio_carraro': '안토니오 카라로',

    // 중국 제조사
    'foton': '포톤',
    'jinma': '진마',
    'dfam': '동펑',
    'lovol': '로볼',

    // 건설장비 제조사
    'volvo': '볼보',
    'hitachi': '히타치',
    'komatsu': '코마츠',
    'bobcat': '밥캣',
    'jcb': 'JCB',
    'liebherr': '리브헤르',
    'terex': '테렉스'
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

export const getFarmingTypeDisplay = (key: string): string => {
  const farmingTypeMap: { [key: string]: string } = {
    paddyFarming: '논농사',
    fieldFarming: '밭농사',
    orchard: '과수원',
    livestock: '축산',
    forageCrop: '사료작물'
  };
  return farmingTypeMap[key] || key;
};

export const getMainCropDisplay = (key: string): string => {
  const mainCropMap: { [key: string]: string } = {
    foodCrops: '식량작물',
    facilityHort: '시설원예',
    fieldVeg: '노지채소',
    fruits: '과수',
    specialCrops: '특용작물',
    flowers: '화훼'
  };
  return mainCropMap[key] || key;
};

export const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
} 