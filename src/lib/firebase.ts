'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

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

// Firebase 초기화를 한 번만 수행
let app;
let analytics;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
} else {
  app = getApps()[0];
}

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// 인증 상태 변경 이벤트 최적화
let unsubscribe: (() => void) | null = null;

if (typeof window !== 'undefined') {
  try {
    unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Auth state changed: User logged in', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      } else {
        console.log('Auth state changed: User logged out');
      }
    }, (error) => {
      console.error('Auth state change error:', error);
    });
  } catch (error) {
    console.error('Failed to set up auth state listener:', error);
  }
}

// 컴포넌트 언마운트 시 구독 해제
export const cleanup = () => {
  if (unsubscribe) {
    try {
      unsubscribe();
      console.log('Auth state listener cleaned up');
    } catch (error) {
      console.error('Failed to cleanup auth state listener:', error);
    }
  }
};

console.log('Firebase Initialized:', {
  isAuthInitialized: !!auth,
  isStorageInitialized: !!storage,
  currentUser: auth.currentUser?.uid
});

export { db, storage, auth, googleProvider, analytics };

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
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
} 