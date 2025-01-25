'use client';

import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 파일 로드
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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

interface Equipment {
  id: string;
  type: string;
  manufacturer: string;
  model: string;
  year: string;
  usageHours: string;
  rating: string;
  forSale: boolean;
  desiredPrice?: string;
  saleStatus?: string;
  saleDate?: string;
  forPurchase: boolean;
  purchasePrice?: string;
  purchaseStatus?: string;
  purchaseDate?: string;
  attachments?: {
    loader?: string;
    loaderModel?: string;
    loaderRating?: string;
    rotary?: string;
    rotaryModel?: string;
    rotaryRating?: string;
    frontWheel?: string;
    frontWheelModel?: string;
    frontWheelRating?: string;
    rearWheel?: string;
    rearWheelModel?: string;
    rearWheelRating?: string;
  };
  memo?: string;
  images?: string[];
}

async function migrateData() {
  try {
    const farmersRef = collection(db, 'farmers');
    const snapshot = await getDocs(farmersRef);
    
    for (const docSnapshot of snapshot.docs) {
      const farmerData = docSnapshot.data();
      
      // 기본 농업 유형 데이터 초기화
      const farmingTypes = {
        paddyFarming: farmerData.paddyFarming || false,
        fieldFarming: farmerData.fieldFarming || false,
        facilityFarming: farmerData.facilityFarming || false,
        livestock: farmerData.livestock || false,
        fruitFarming: farmerData.fruitFarming || false
      };
      
      // 기존 equipment 필드가 있는 경우에만 변환
      if (farmerData.equipment) {
        const oldEquipment = farmerData.equipment;
        
        // 새로운 equipment 객체 생성
        const newEquipment: Equipment = {
          id: uuidv4(),
          type: oldEquipment.type || '',
          manufacturer: oldEquipment.manufacturer || '',
          model: oldEquipment.model || '',
          year: oldEquipment.year || '',
          usageHours: oldEquipment.usageHours || '',
          rating: oldEquipment.rating || '',
          forSale: oldEquipment.forSale || false,
          desiredPrice: oldEquipment.desiredPrice || '',
          saleStatus: oldEquipment.saleStatus || '',
          saleDate: oldEquipment.saleDate || '',
          forPurchase: oldEquipment.forPurchase || false,
          purchasePrice: oldEquipment.purchasePrice || '',
          purchaseStatus: oldEquipment.purchaseStatus || '',
          purchaseDate: oldEquipment.purchaseDate || '',
          attachments: oldEquipment.attachments || {},
          memo: oldEquipment.memo || '',
          images: oldEquipment.images || []
        };
        
        // 문서 업데이트
        const farmerRef = doc(db, 'farmers', docSnapshot.id);
        await updateDoc(farmerRef, {
          equipments: [newEquipment],  // 배열로 변환
          equipment: null,  // 기존 필드 제거
          ...farmingTypes  // 농업 유형 데이터 추가
        });
        
        console.log(`Migrated data for farmer: ${docSnapshot.id}`);
      } else {
        // equipment가 없는 경우에도 농업 유형 데이터는 업데이트
        const farmerRef = doc(db, 'farmers', docSnapshot.id);
        await updateDoc(farmerRef, {
          ...farmingTypes
        });
        
        console.log(`Updated farming types for farmer: ${docSnapshot.id}`);
      }
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// 스크립트 실행
migrateData(); 