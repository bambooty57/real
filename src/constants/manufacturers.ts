export const MANUFACTURERS = {
  MAIN: [
    { value: 'daedong', label: '대동' },
    { value: 'kukje', label: '국제' },
    { value: 'ls', label: 'LS' },
    { value: 'yanmar', label: '얀마' },
    { value: 'kubota', label: '구보다' },
    { value: 'john_deere', label: '존디어' },
    { value: 'new_holland', label: '뉴홀랜드' },
    { value: 'mf', label: 'MF' },
    { value: 'case', label: '케이스' },
    { value: 'other', label: '기타' }
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
  { value: 'new', label: '신규' },
  { value: 'used', label: '중고' }
] as const;

export const TRADE_METHODS = [
  { value: 'purchase', label: '구매희망' },
  { value: 'sale', label: '판매희망' }
] as const;

export const TRADE_STATUS = [
  { value: 'available', label: '가능' },
  { value: 'completed', label: '완료' }
] as const;

export const ATTACHMENT_TYPES = [
  { value: 'loader', label: '로더' },
  { value: 'rotary', label: '로타리' },
  { value: 'frontWheel', label: '전륜' },
  { value: 'rearWheel', label: '후륜' }
];

export const COMBINE_ROWS = [
  { value: '3', label: '3조식' },
  { value: '4', label: '4조식' },
  { value: '5', label: '5조식' },
  { value: '6', label: '6조식' },
  { value: '7', label: '7조식' },
  { value: '8', label: '8조식' },
  { value: '9', label: '9조식' },
  { value: '10', label: '10조식' }
] as const;

export const TRANSPLANTER_ROWS = [
  { value: '4', label: '4조식' },
  { value: '5', label: '5조식' },
  { value: '6', label: '6조식' },
  { value: '7', label: '7조식' },
  { value: '8', label: '8조식' },
  { value: '9', label: '9조식' },
  { value: '10', label: '10조식' }
] as const;

export const COMBINE_CUTTING_TYPES = [
  { value: 'binding', label: '결속형' },
  { value: 'spreading', label: '산포형' }
] as const;

export const COMBINE_THRESHING_TYPES = [
  { value: 'axial', label: '축류식' },
  { value: 'mixed', label: '혼합식' }
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