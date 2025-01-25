export const MANUFACTURERS = {
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