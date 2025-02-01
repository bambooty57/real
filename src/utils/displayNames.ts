// 영농형태 한글 표시
export const getFarmingTypeDisplay = (type: string): string => {
  const displayNames: { [key: string]: string } = {
    waterPaddy: '수도작',
    fieldFarming: '밭농사',
    orchard: '과수원',
    livestock: '축산업',
    forageCrop: '사료작물'
  };
  return displayNames[type] || type;
};

// 주작물 한글 표시
export const getMainCropDisplay = (crop: string): string => {
  const displayNames: { [key: string]: string } = {
    rice: '벼',
    barley: '보리',
    wheat: '밀',
    corn: '옥수수',
    potato: '감자',
    sweetPotato: '고구마',
    soybean: '콩',
    redPepper: '고추',
    garlic: '마늘',
    onion: '양파',
    greenOnion: '파',
    cabbage: '배추',
    radish: '무',
    cucumber: '오이',
    tomato: '토마토',
    strawberry: '딸기',
    watermelon: '수박',
    melon: '멜론',
    apple: '사과',
    pear: '배',
    peach: '복숭아',
    grape: '포도',
    persimmon: '감',
    citrus: '귤',
    ginseng: '인삼'
  };
  return displayNames[crop] || crop;
};

// 농기계 종류 한글 표시
export const getKoreanEquipmentType = (type: string): string => {
  const displayNames: { [key: string]: string } = {
    tractor: '트랙터',
    combine: '콤바인',
    rice_transplanter: '이앙기',
    forklift: '지게차',
    excavator: '굴삭기',
    skid_loader: '스키로더',
    dryer: '건조기',
    silo: '싸일론',
    drone: '드론'
  };
  return displayNames[type] || type;
};

// 제조사 한글 표시
export const getKoreanManufacturer = (manufacturer: string): string => {
  const displayNames: { [key: string]: string } = {
    DAEDONG: '대동',
    LS: 'LS',
    KUKJE: '국제',
    TYM: 'TYM',
    BRANSON: '브랜슨',
    DONGYANG: '동양',
    ASIA: '아시아',
    YANMAR: '얀마',
    ISEKI: '이세키',
    KUBOTA: '구보다',
    JOHN_DEERE: '존디어',
    NEW_HOLLAND: '뉴홀랜드',
    MASSEY_FERGUSON: '매시퍼거슨',
    HYUNDAI: '현대건설기계',
    SAMSUNG: '삼성건설기계',
    VOLVO: '볼보건설기계',
    DAEWOO: '대우건설기계',
    DOOSAN: '두산인프라코어',
    BOBCAT: '밥캣',
    CATERPILLAR: '캐터필러',
    KOMATSU: '코마츠',
    HITACHI: '히타치',
    JCB: 'JCB',
    HEUNGSUNG: '흥성',
    SEWOONG: '세웅',
    BONSA: '본사'
  };
  return displayNames[manufacturer] || manufacturer;
};

// 작물 상세 한글 표시
export const cropDisplayNames: { [key: string]: string } = {
  rice: '벼',
  barley: '보리',
  wheat: '밀',
  corn: '옥수수',
  potato: '감자',
  sweetPotato: '고구마',
  soybean: '콩',
  redPepper: '고추',
  garlic: '마늘',
  onion: '양파',
  greenOnion: '파',
  cabbage: '배추',
  radish: '무',
  cucumber: '오이',
  tomato: '토마토',
  strawberry: '딸기',
  watermelon: '수박',
  melon: '멜론',
  apple: '사과',
  pear: '배',
  peach: '복숭아',
  grape: '포도',
  persimmon: '감',
  citrus: '귤',
  ginseng: '인삼'
}; 