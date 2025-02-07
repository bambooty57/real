export const MANUFACTURERS = {
  MAIN: [
    { value: 'DAEDONG', label: '대동' },
    { value: 'LS', label: 'LS' },
    { value: 'KUKJE', label: '국제' },
    { value: 'TYM', label: 'TYM' },
    { value: 'BRANSON', label: '브랜슨' },
    { value: 'DONGYANG', label: '동양' },
    { value: 'ASIA', label: '아시아' },
    { value: 'YANMAR', label: '얀마' },
    { value: 'ISEKI', label: '이세키' },
    { value: 'KUBOTA', label: '구보다' },
    { value: 'MITSUBISHI', label: '미쯔비시' },
    { value: 'HINOMOTO', label: '히노모토' },
    { value: 'SHIBAURA', label: '시바우라' },
    { value: 'JOHN_DEERE', label: '존디어' },
    { value: 'NEW_HOLLAND', label: '뉴홀랜드' },
    { value: 'MASSEY_FERGUSON', label: '매시퍼거슨' },
    { value: 'FENDT', label: '펜트' },
    { value: 'DEUTZ_FAHR', label: '도이츠파' },
    { value: 'SAME', label: '세메' },
    { value: 'LANDINI', label: '란디니' },
    { value: 'VALTRA', label: '발트라' },
    { value: 'CLAAS', label: '클라스' },
    { value: 'CASE_IH', label: '케이스IH' },
    { value: 'MAHINDRA', label: '마힌드라' },
    { value: 'KIOTI', label: '키오티' },
    { value: 'HYUNDAI', label: '현대건설기계' },
    { value: 'SAMSUNG', label: '삼성건설기계' },
    { value: 'VOLVO', label: '볼보건설기계' },
    { value: 'DAEWOO', label: '대우건설기계' },
    { value: 'DOOSAN', label: '두산인프라코어' },
    { value: 'BOBCAT', label: '밥캣' },
    { value: 'CATERPILLAR', label: '캐터필러' },
    { value: 'KOMATSU', label: '코마츠' },
    { value: 'HITACHI', label: '히타치' },
    { value: 'JCB', label: 'JCB' },
    { value: 'OTHER', label: '기타' }
  ],
  EQUIPMENT: [
    { value: 'tractor', label: '트랙터' },
    { value: 'transplanter', label: '이앙기' },
    { value: 'combine', label: '콤바인' },
    { value: 'forklift', label: '지게차' },
    { value: 'excavator', label: '굴삭기' },
    { value: 'skidloader', label: '스키로더' },
    { value: 'dryer', label: '건조기' },
    { value: 'other', label: '기타' }
  ],
  LOADER: [
    { value: 'hanil', label: '한일' },
    { value: 'taesung', label: '태성' },
    { value: 'ansung', label: '안성' },
    { value: 'heemang', label: '희망' },
    { value: 'jangsu', label: '장수' },
    { value: 'bonsa', label: '본사' },
    { value: 'heungsung', label: '흥성' },
    { value: 'other', label: '기타' }
  ],
  ROTARY: [
    { value: 'woongjin', label: '웅진' },
    { value: 'samwon', label: '삼원' },
    { value: 'weeken', label: '위켄' },
    { value: 'youngjin', label: '영진' },
    { value: 'agros', label: '아그로스' },
    { value: 'chelli', label: '첼리' },
    { value: 'jungang', label: '중앙' },
    { value: 'folder', label: '폴더' },
    { value: 'sungwoo', label: '성우' },
    { value: 'sewoong', label: '세웅' },
    { value: 'bonsa', label: '본사' },
    { value: 'other', label: '기타' }
  ],
  WHEEL: [
    { value: 'heungah', label: '흥아' },
    { value: 'bkt', label: 'BKT' },
    { value: 'michelin', label: '미셀린' },
    { value: 'india', label: '인도' },
    { value: 'china', label: '중국' },
    { value: 'other', label: '기타' }
  ]
} as const;

export const TRADE_TYPES = [
  { value: 'new', label: '신품' },
  { value: 'used', label: '중고' }
] as const;

export const TRADE_METHODS = [
  { value: 'sale', label: '판매' },
  { value: 'purchase', label: '구매' }
] as const;

export const TRADE_STATUS = [
  { value: 'available', label: '거래가능' },
  { value: 'reserved', label: '예약중' },
  { value: 'completed', label: '거래완료' }
] as const;

export const ATTACHMENT_TYPES = [
  { value: 'loader', label: '로더' },
  { value: 'rotary', label: '로타리' },
  { value: 'frontWheel', label: '전륜' },
  { value: 'rearWheel', label: '후륜' }
];

export const COMBINE_ROWS = [
  { value: '3', label: '3조' },
  { value: '4', label: '4조' },
  { value: '5', label: '5조' },
  { value: '6', label: '6조' },
  { value: '7', label: '7조' },
  { value: '8', label: '8조' },
  { value: '9', label: '9조' },
  { value: '10', label: '10조' }
] as const;

export const TRANSPLANTER_ROWS = [
  { value: '4', label: '4조' },
  { value: '5', label: '5조' },
  { value: '6', label: '6조' },
  { value: '7', label: '7조' },
  { value: '8', label: '8조' },
  { value: '9', label: '9조' },
  { value: '10', label: '10조' }
] as const;

export const COMBINE_CUTTING_TYPES = [
  { value: 'binding', label: '결속형' },
  { value: 'spreading', label: '산취형' }
] as const;

export const TRANSPLANTER_TYPES = [
  { value: 'riding', label: '승용' },
  { value: 'walking', label: '보행' }
] as const;

export const FORKLIFT_MAST_TYPES = [
  { value: '2stage', label: '2단' },
  { value: '3stage', label: '3단' },
  { value: '4stage', label: '4단' }
] as const;

export const FORKLIFT_TIRE_TYPES = [
  { value: 'solid', label: '솔리드' },
  { value: 'pneumatic', label: '공기압' }
] as const; 