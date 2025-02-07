import { FarmingTypes, MainCrop } from '@/types/farmer'

// 농기계 타입 매핑
const equipmentTypeMap: { [key: string]: string } = {
  'tractor': '트랙터',
  'combine': '콤바인',
  'transplanter': '이앙기',
  'forklift': '지게차',
  'excavator': '굴삭기',
  'skidLoader': '스키로더',
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
    'hyundai': '현대건설기계',
    'samsung': '삼성건설기계',
    'doosan': '두산인프라코어',
    'tong_yang': '동양',
    'kumsung': '금성',
    'hansung': '한성',
    'tymnet': '티와이엠',
    'branson': '브랜슨',
    'daewoo': '대우건설기계',

    // 일본 제조사
    'yanmar': '얀마',
    'kubota': '구보다',
    'iseki': '이세키',
    'mitsubishi': '미쯔비시',
    'hinomoto': '히노모토',
    'shibaura': '시바우라',
    'hitachi': '히타치',
    'komatsu': '코마츠',

    // 미국 제조사
    'john_deere': '존디어',
    'case': '케이스',
    'new_holland': '뉴홀랜드',
    'massey_ferguson': '매시퍼거슨',
    'agco': '아그코',
    'caterpillar': '캐터필러',
    'mccormick': '맥코믹',
    'bobcat': '밥캣',

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
    'volvo': '볼보건설기계',
    'jcb': 'JCB',
    'liebherr': '리브헤르',

    // 중국 제조사
    'foton': '포톤',
    'jinma': '진마',
    'dfam': '동펑',
    'lovol': '로볼',

    // 로더 제조사
    'hanil': '한일',
    'taesung': '태성',
    'ansung': '안성',
    'heemang': '희망',
    'jangsu': '장수',
    'bonsa': '본사',

    // 로터리 제조사
    'woongjin': '웅진',
    'samwon': '삼원',
    'weeken': '위켄',
    'youngjin': '영진',
    'agros': '아그로스',
    'chelli': '첼리',
    'jungang': '중앙',
    'folder': '폴더',
    'sungwoo': '성우',

    // 휠 제조사
    'heungah': '흥아',
    'bkt': 'BKT',
    'michelin': '미셀린',
    'india': '인도',
    'china': '중국'
  };
  return manufacturerMap[manufacturer.toLowerCase()] || manufacturer;
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
export const cropDisplayNames: Record<string, string> = {
  rice: '벼',
  barley: '보리',
  wheat: '밀',
  corn: '옥수수',
  potato: '감자',
  soybean: '콩',
  sweetPotato: '고구마',
  tomato: '토마토',
  strawberry: '딸기',
  cucumber: '오이',
  pepper: '고추',
  watermelon: '수박',
  melon: '멜론',
  cabbage: '배추',
  radish: '무',
  garlic: '마늘',
  onion: '양파',
  carrot: '당근',
  apple: '사과',
  pear: '배',
  grape: '포도',
  peach: '복숭아',
  citrus: '감귤',
  sesame: '참깨',
  perilla: '들깨',
  ginseng: '인삼',
  medicinalHerbs: '약용작물',
  rose: '장미',
  chrysanthemum: '국화',
  lily: '백합',
  orchid: '난',
  cattle: '한우',
  pig: '돼지',
  chicken: '닭',
  duck: '오리',
  goat: '염소',
  dairy: '젖소',
  other: '기타',
  persimmon: '감',
  plum: '자두',
  sorghum: '수수',
};

export const getFarmingTypeDisplay = (key: string): string => {
  const farmingTypeMap: { [key: string]: string } = {
    waterPaddy: '수도작',
    paddyFarming: '논농사',
    fieldFarming: '밭농사',
    orchard: '과수원',
    livestock: '축산',
    forageCrop: '사료작물'
  };
  return farmingTypeMap[key] || key;
};

const mainCropMap: { [key: string]: string } = {
  foodCrops: '식량작물',
  facilityHort: '시설원예',
  fieldVeg: '노지채소',
  fruits: '과수',
  specialCrops: '특용작물',
  flowers: '화훼',
  livestock: '축산'
};

export const getMainCropDisplay = (key: string): string => {
  return mainCropMap[key] || key;
};

export const getMainCropText = (mainCrop: any) => {
  if (!mainCrop) return '';

  // 상세 항목이 있는 경우 상세 항목을 표시
  const details = [
    ...mainCrop.foodCropsDetails || [],
    ...mainCrop.facilityHortDetails || [],
    ...mainCrop.fieldVegDetails || [],
    ...mainCrop.fruitsDetails || [],
    ...mainCrop.specialCropsDetails || [],
    ...mainCrop.flowersDetails || [],
    ...mainCrop.livestockDetails || []
  ];

  if (details.length > 0) {
    return details.map(item => cropDisplayNames[item] || item).join(', ');
  }

  // 상세 항목이 없는 경우 선택된 카테고리 표시
  return Object.entries(mainCrop)
    .filter(([key, value]) => value && !key.endsWith('Details'))
    .map(([key]) => mainCropMap[key] || key)
    .join(', ');
};

export const getKoreanEquipmentType = (type: string): string => {
  return equipmentTypeMap[type.toLowerCase()] || type
} 