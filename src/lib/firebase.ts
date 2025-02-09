'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: 'real-81ba6.firebasestorage.app',  // 하드코딩된 올바른 값
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Firebase Config:', {
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

// Firebase 초기화를 한 번만 수행
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// 인증 상태 초기화 대기
auth.onAuthStateChanged((user) => {
  console.log('Firebase Auth State Changed:', {
    isAuthenticated: !!user,
    email: user?.email,
    emailVerified: user?.emailVerified,
    uid: user?.uid
  });
});

console.log('Firebase Initialized:', {
  isAuthInitialized: !!auth,
  isStorageInitialized: !!storage,
  currentUser: auth.currentUser?.uid
});

export { db, storage, auth, googleProvider };

// Firebase 연결 테스트 함수
export async function testFirebaseConnection() {
  try {
    if (!db) {
      throw new Error('Firestore instance is not initialized');
    }
    
    // 간단한 읽기 작업으로 연결 테스트
    const testRef = collection(db, 'farmers');
    const q = query(testRef, limit(1));
    await getDocs(q);
    
    return true;
  } catch (error) {
    return false;
  }
} 