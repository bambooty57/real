# 데이터 마이그레이션 가이드

## 1. 환경 설정

### Firebase 서비스 계정 설정
1. Firebase Console에서 프로젝트 설정 > 서비스 계정으로 이동
2. 새 비공개 키 생성 버튼을 클릭하여 서비스 계정 키(JSON) 다운로드
3. 다운로드 받은 JSON 파일을 `scripts/service-account.json`으로 저장

## 2. 데이터 구조 변경사항

### 기본정보 변경
- `birth` → `age` 필드명 변경
- `businessName`과 `companyName` 통합 → `businessName`으로 단일화

### 주소정보 구조화
```typescript
address: {
  zipCode: string;
  roadAddress: string;
  jibunAddress: string;
  addressDetail?: string;
  canReceiveMail: boolean;
}
```

### 이미지정보 구조화
```typescript
images: {
  farmer: string[];      // 농민 이미지
  main: string[];        // 대표 이미지
  attachments: {         // 부착물 이미지
    loader: string[];
    rotary: string[];
    frontWheel: string[];
    rearWheel: string[];
  }
}
```

### 주요작물 카테고리화
```typescript
mainCrop: {
  foodCrops: {          // 식량작물
    rice: boolean;      // 벼
    barley: boolean;    // 보리
    wheat: boolean;     // 밀
    corn: boolean;      // 옥수수
    potato: boolean;    // 감자
    soybean: boolean;   // 콩
  },
  facilityHort: {       // 시설원예
    tomato: boolean;    // 토마토
    cucumber: boolean;  // 오이
    melon: boolean;     // 멜론
    pepper: boolean;    // 피망
    lettuce: boolean;   // 상추
    spinach: boolean;   // 시금치
    strawberry: boolean;// 딸기
    blueberry: boolean; // 블루베리
  },
  fieldVeg: {           // 노지채소
    chili: boolean;     // 고추
    garlic: boolean;    // 마늘
    onion: boolean;     // 양파
    radish: boolean;    // 무
    cabbage: boolean;   // 배추
    carrot: boolean;    // 당근
  },
  fruits: {             // 과수
    apple: boolean;     // 사과
    pear: boolean;      // 배
    grape: boolean;     // 포도
    peach: boolean;     // 복숭아
    plum: boolean;      // 자두
    persimmon: boolean; // 감
    cherry: boolean;    // 체리
    citrus: boolean;    // 귤
  },
  special: {            // 특용작물
    ginseng: boolean;   // 인삼
    sesame: boolean;    // 참깨
    perilla: boolean;   // 들깨
    tobacco: boolean;   // 연초
  },
  livestock: {          // 축산
    hanwoo: boolean;    // 한우
    dairy: boolean;     // 젖소
    pig: boolean;       // 돼지
    chicken: boolean;   // 닭
    duck: boolean;      // 오리
    goat: boolean;      // 염소
  },
  other: boolean;       // 기타
}
```

### 장비정보 구조화
```typescript
equipments: [{
  // 기본정보
  id: string;
  type: string;        // tractor/combine/transplanter/forklift
  manufacturer: string;
  model: string;
  year: string;
  usageHours: string;
  rating: string;
  memo: string;
  images: string[];
  source: string;

  // 거래정보
  trade: {
    saleType: 'new'|'used'|null;  // 회사→농민 판매이력(새제품/중고)
    tradeType: string;            // 농민→회사 요청(판매/구매)
    desiredPrice: string;         // 희망가격
    saleStatus: string;           // 거래상태(가능/완료)
  };

  // 장비별 스펙
  specs?: {
    // 이앙기 관련
    rows?: string;               // 조수
    transplanterType?: string;   // 이앙기 타입
    seedlingCapacity?: string;   // 묘탑재량
    hasFertilizer?: boolean;     // 시비기 유무
    hasSideFertilizer?: boolean; // 측조시비기 유무

    // 콤바인 관련
    cuttingType?: string;        // 예취방식
    threshingType?: string;      // 탈곡방식
    grainTankCapacity?: string;  // 곡물탱크용량

    // 지게차 관련
    maxLiftHeight?: string;      // 최대인상높이
    maxLoadWeight?: string;      // 최대적재중량
    mastType?: string;           // 마스트타입
    tireType?: string;           // 타이어타입
    hasSideShift?: boolean;      // 사이드쉬프트 유무
  };

  // 트랙터 부착물 정보 (트랙터 타입인 경우에만)
  attachments?: {
    loader: string;          // 로더
    loaderModel: string;     // 로더 모델
    loaderRating: string;    // 로더 상태
    rotary: string;          // 로터리
    rotaryModel: string;     // 로터리 모델
    rotaryRating: string;    // 로터리 상태
    frontWheel: string;      // 전륜
    frontWheelModel: string; // 전륜 모델
    frontWheelRating: string;// 전륜 상태
    rearWheel: string;       // 후륜
    rearWheelModel: string;  // 후륜 모델
    rearWheelRating: string; // 후륜 상태
  };
}]
```

## 3. 마이그레이션 실행

### 마이그레이션 스크립트 실행
```bash
npm run migrate
```

### 데이터 확인
```bash
npm run count-farmers
```

## 4. 주의사항
1. 마이그레이션은 기존 데이터를 완전히 새로운 구조로 덮어씁니다.
2. 마이그레이션 전 데이터 백업을 권장합니다.
3. 트랙터 타입의 장비에만 부착물(attachments) 정보가 있습니다.
4. 장비별로 필요한 스펙 필드가 다르므로, 불필요한 필드는 undefined로 저장됩니다. 