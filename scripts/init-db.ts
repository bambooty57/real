import * as admin from 'firebase-admin';

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function initializeDB() {
  try {
    // farmers 컬렉션에 샘플 데이터 추가
    const farmersRef = db.collection('farmers');
    
    await farmersRef.add({
      name: '홍길동',
      address: '서울시 강남구',
      phone: '010-1234-5678',
      ageGroup: '50대',
      mainCrop: '쌀',
      equipment: {
        type: '트랙터',
        manufacturer: '대동',
        attachments: {
          loader: '본사',
          rotary: '삼원',
          wheels: '흥아'
        }
      }
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

initializeDB(); 