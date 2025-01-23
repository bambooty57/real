'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화 함수
function initializeFirebase() {
  if (typeof window === 'undefined') {
    return { db: undefined, storage: undefined };
  }

  try {
    // 환경변수 확인
    const missingVars = Object.entries(firebaseConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('Missing Firebase configuration variables:', missingVars);
      throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
    }

    // Firebase 앱이 이미 초기화되어 있는지 확인
    let app;
    if (!getApps().length) {
      console.log('Initializing new Firebase app');
      app = initializeApp(firebaseConfig);
    } else {
      console.log('Firebase app already initialized');
      app = getApps()[0];
    }

    const db = getFirestore(app);
    const storage = getStorage(app);

    // Storage 버킷 설정 확인
    if (!firebaseConfig.storageBucket) {
      throw new Error('Firebase Storage bucket is not configured');
    }

    // 개발 환경에서만 설정 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Firebase Configuration ===');
      console.log('API Key:', firebaseConfig.apiKey ? '설정됨' : '미설정');
      console.log('Project ID:', firebaseConfig.projectId);
      console.log('Auth Domain:', firebaseConfig.authDomain);
      console.log('Storage Bucket:', firebaseConfig.storageBucket);
      console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '설정됨' : '미설정');
      console.log('App ID:', firebaseConfig.appId ? '설정됨' : '미설정');
      console.log('Measurement ID:', firebaseConfig.measurementId ? '설정됨' : '미설정');
      console.log('===========================');
    }

    return { db, storage };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Firebase 초기화 및 내보내기
const { db, storage } = initializeFirebase();

// Firebase 연결 테스트 함수
export async function testFirebaseConnection() {
  try {
    if (!db) {
      throw new Error('Firestore instance is not initialized');
    }
    
    // 간단한 읽기 작업으로 연결 테스트
    const testRef = db.collection('farmers').limit(1);
    await testRef.get();
    
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}

export { db, storage }; 