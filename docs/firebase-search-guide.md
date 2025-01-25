# Firebase 데이터 검색 가이드

이 가이드는 Firebase Admin SDK를 사용하여 Firestore 데이터베이스의 데이터를 검색하는 방법을 설명합니다. 이 가이드를 그대로 따라하면 한 번에 성공할 수 있습니다.

## 1. 필요한 패키지 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
npm install firebase-admin dotenv
```

## 2. Firebase 서비스 계정 키 준비

1. [Firebase 콘솔](https://console.firebase.google.com/)에 접속
2. 프로젝트 설정(⚙️) 클릭
3. 서비스 계정 탭 선택
4. "Firebase Admin SDK" 섹션에서 "새 비공개 키 생성" 버튼 클릭
5. 다운로드 받은 JSON 파일을 프로젝트 루트에 `service-account-key.json` 이름으로 저장

## 3. 스크립트 생성

1. 프로젝트 루트에 `scripts` 폴더가 없다면 생성
2. `scripts/count-farmers.js` 파일을 생성하고 다음 코드를 작성:

```javascript
const admin = require('firebase-admin');
const path = require('path');

// Firebase Admin SDK 초기화
const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function countFarmers() {
  try {
    const farmersRef = db.collection('farmers');
    const snapshot = await farmersRef.get();
    
    console.log('\n=== 농민 수 조회 결과 ===\n');
    console.log(`총 농민 수: ${snapshot.size}명`);
    
  } catch (error) {
    console.error('데이터 조회 중 오류 발생:', error);
  } finally {
    // Firebase 연결 종료
    admin.app().delete();
  }
}

countFarmers();
```

## 4. 스크립트 실행

프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다:

```bash
node scripts/count-farmers.js
```

## 5. 성공 결과 예시

스크립트가 성공적으로 실행되면 다음과 같은 결과가 출력됩니다:

```bash
=== 농민 수 조회 결과 ===

총 농민 수: 595명
```

## 6. 다양한 데이터 조회 예시

### 특정 조건으로 필터링
```javascript
// 예: 나이가 40대인 농민만 조회
const snapshot = await farmersRef.where('ageGroup', '==', '40대').get();
console.log(`40대 농민 수: ${snapshot.size}명`);

// 예: 논농사를 짓는 농민만 조회
const snapshot = await farmersRef
  .where('farmingTypes.paddyFarming', '==', true)
  .get();
console.log(`논농사 농민 수: ${snapshot.size}명`);

// 예: 특정 지역 농민만 조회
const snapshot = await farmersRef
  .where('roadAddress', '>=', '전라남도')
  .where('roadAddress', '<', '전라남도' + '\uf8ff')
  .get();
console.log(`전라남도 농민 수: ${snapshot.size}명`);
```

### 정렬해서 조회
```javascript
// 예: 이름순으로 정렬하여 조회
const snapshot = await farmersRef
  .orderBy('name')
  .get();

snapshot.forEach(doc => {
  console.log(`농민 이름: ${doc.data().name}`);
});
```

### 특정 개수만 조회
```javascript
// 예: 처음 10명만 조회
const snapshot = await farmersRef
  .limit(10)
  .get();

snapshot.forEach(doc => {
  const data = doc.data();
  console.log(`이름: ${data.name}, 전화번호: ${data.phone}`);
});
```

## 주의사항

1. 보안을 위한 필수 설정:
   - `service-account-key.json` 파일을 절대로 GitHub에 올리지 마세요.
   - 프로젝트 루트의 `.gitignore` 파일에 다음 줄을 추가하세요:
     ```
     service-account-key.json
     ```

2. 파일 위치 확인:
   - `service-account-key.json`이 프로젝트 루트에 있는지 확인
   - `scripts/count-farmers.js` 파일이 올바른 위치에 있는지 확인

3. 실행 위치:
   - 반드시 프로젝트 루트 디렉토리에서 스크립트를 실행하세요.
   - 다른 디렉토리에서 실행하면 서비스 계정 키 파일을 찾지 못할 수 있습니다.

## 문제 해결

1. "Cannot find module '../service-account-key.json'" 에러가 발생하는 경우:
   - `service-account-key.json` 파일이 프로젝트 루트에 있는지 확인
   - 프로젝트 루트 디렉토리에서 스크립트를 실행하고 있는지 확인

2. "Failed to parse private key" 에러가 발생하는 경우:
   - Firebase 콘솔에서 새로운 키를 다시 생성
   - 다운로드 받은 JSON 파일을 그대로 사용 (수정하지 말 것)

3. 데이터를 찾을 수 없는 경우:
   - Firebase 콘솔에서 'Firestore Database' 메뉴로 이동
   - 'farmers' 컬렉션이 존재하는지 확인
   - 실제 데이터가 있는지 확인

4. 권한 관련 에러가 발생하는 경우:
   - Firebase 콘솔의 프로젝트 설정에서 서비스 계정 탭 확인
   - Admin SDK가 필요한 권한을 가지고 있는지 확인 