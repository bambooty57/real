import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface Equipment {
  id: string;
  saleStatus?: string;
  purchaseStatus?: string;
  images?: string[];
  [key: string]: any;
}

interface Farmer {
  equipments?: Equipment[];
  [key: string]: any;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('Firebase Config:', firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTradeStatus() {
  try {
    console.log('마이그레이션 시작...');
    
    // farmers 컬렉션의 모든 문서 가져오기
    const farmersSnapshot = await getDocs(collection(db, 'farmers'));
    const updatePromises: Promise<void>[] = [];

    farmersSnapshot.forEach(docSnapshot => {
      const farmer = docSnapshot.data() as Farmer;
      let needsUpdate = false;
      
      if (farmer.equipments && Array.isArray(farmer.equipments)) {
        const updatedEquipments = farmer.equipments.map(equipment => {
          let updated = { ...equipment };
          
          // 판매 상태 변경
          if (equipment.saleStatus) {
            switch (equipment.saleStatus) {
              case 'available':
                updated.saleStatus = '판매가능';
                needsUpdate = true;
                break;
              case 'reserved':
                updated.saleStatus = '예약중';
                needsUpdate = true;
                break;
              case 'sold':
                updated.saleStatus = '판매완료';
                needsUpdate = true;
                break;
            }
          }

          // 구매 상태 변경
          if (equipment.purchaseStatus) {
            switch (equipment.purchaseStatus) {
              case 'searching':
                updated.purchaseStatus = '구매가능';
                needsUpdate = true;
                break;
              case 'completed':
                updated.purchaseStatus = '구매완료';
                needsUpdate = true;
                break;
            }
          }

          return updated;
        });

        if (needsUpdate) {
          console.log(`농민 ID ${docSnapshot.id} 업데이트 큐에 추가됨`);
          updatePromises.push(
            updateDoc(doc(db, 'farmers', docSnapshot.id), {
              equipments: updatedEquipments
            })
          );
        }
      }
    });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`총 ${updatePromises.length}개의 문서가 업데이트됨`);
    } else {
      console.log('업데이트가 필요한 문서가 없음');
    }

    console.log('마이그레이션 완료');
  } catch (error) {
    console.error('마이그레이션 중 오류 발생:', error);
    throw error;
  }
}

// 스크립트 실행
migrateTradeStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 