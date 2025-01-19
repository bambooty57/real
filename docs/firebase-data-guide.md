# Firebase 데이터 조회 가이드

## 1. 스크립트 생성
`src/scripts/getFarmersData.js` 파일을 생성하고 아래 코드를 작성합니다:

```javascript
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyC8Wd4tAYQzDYfOTIWGHEwgwypGxVy_jGc",
  authDomain: "real-c7c4d.firebaseapp.com",
  projectId: "real-c7c4d",
  storageBucket: "real-c7c4d.appspot.com",
  messagingSenderId: "1098476898085",
  appId: "1:1098476898085:web:1b3f5b05c0498161c7f67c",
  measurementId: "G-QTHG8GX6EE"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getFarmersData() {
  try {
    // Firebase 인증
    await signInWithEmailAndPassword(auth, "admin@admin.com", "123456");
    
    // farmers 컬렉션 데이터 조회
    const farmersRef = collection(db, 'farmers');
    const snapshot = await getDocs(farmersRef);
    
    console.log('\n=== Farmers Collection Data ===\n');
    
    // 데이터 출력
    snapshot.docs.forEach(doc => {
      console.log('Document ID:', doc.id);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
      console.log('-----------------------------------');
    });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

getFarmersData();
```

## 2. 필요한 패키지 설치
```bash
npm install firebase firebase-admin dotenv
```

## 3. 스크립트 실행
```bash
node src/scripts/getFarmersData.js
```

## 4. 데이터 구조

### Farmers 컬렉션 문서 구조
```typescript
interface Farmer {
  id: string                    // 문서 ID
  name: string                  // 이름
  businessName?: string         // 상호명
  roadAddress: string          // 도로명 주소
  jibunAddress: string         // 지번 주소
  addressDetail?: string       // 상세 주소
  phone: string                // 전화번호
  ageGroup: string             // 연령대
  memo?: string                // 메모
  
  // 이미지 관련
  farmerImages?: string[]      // 농민 사진
  mainImages?: string[]        // 메인 이미지
  attachmentImages?: {         // 부착장비 이미지
    loader?: string[]
    rotary?: string[]
    frontWheel?: string[]
    rearWheel?: string[]
  }

  // 농업 형태
  farmingTypes: {
    paddyFarming?: boolean    // 논농사
    fieldFarming?: boolean    // 밭농사
    livestock?: boolean       // 축산
    orchard?: boolean        // 과수원
    forageCrop?: boolean     // 조사료
  }

  // 주요 작물
  mainCrop: {
    rice: boolean            // 벼
    barley: boolean         // 보리
    hanwoo: boolean         // 한우
    soybean: boolean        // 콩
    sweetPotato: boolean    // 고구마
    persimmon: boolean      // 감
    pear: boolean          // 배
    plum: boolean          // 자두
    sorghum: boolean       // 수수
    goat: boolean          // 염소
    other: boolean         // 기타
  }

  // 보유 농기계
  equipments: Array<{
    id: string
    type: string           // 기종
    manufacturer: string   // 제조사
    model?: string        // 모델명
    year?: string         // 연식
    usageHours?: string   // 사용시간
    rating?: string       // 상태등급
    forSale?: boolean     // 판매여부
    desiredPrice?: string // 희망가격
    saleStatus?: string   // 판매상태
    forPurchase?: boolean // 구매여부
    purchasePrice?: string // 구매가격
    purchaseStatus?: string // 구매상태
    images?: string[]     // 장비 이미지
    attachments?: {
      loader?: string
      loaderModel?: string
      loaderRating?: string
      rotary?: string
      rotaryModel?: string
      rotaryRating?: string
      frontWheel?: string
      frontWheelModel?: string
      frontWheelRating?: string
      rearWheel?: string
      rearWheelModel?: string
      rearWheelRating?: string
    }
    memo?: string         // 메모
  }>
}
``` 