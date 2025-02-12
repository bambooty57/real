'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화 전에 환경 변수 확인
if (!firebaseConfig.apiKey) {
  throw new Error('Firebase API Key is missing. Please check your environment variables.');
}

// Firebase 초기화
let firebaseInstance: any = null;

function initializeFirebase() {
  if (firebaseInstance) {
    return firebaseInstance;
  }

  try {
    console.log('Initializing Firebase with config:', {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey?.substring(0, 8) + '...' // API 키의 일부만 로그
    });

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    auth.useDeviceLanguage(); // 브라우저 언어 설정 사용
    const db = getFirestore(app);
    const storage = getStorage(app);
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    firebaseInstance = { app, auth, db, storage, googleProvider };
    console.log('Firebase initialized successfully');

    return firebaseInstance;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

const firebase = initializeFirebase();

export const app = firebase.app;
export const auth = firebase.auth;
export const db = firebase.db;
export const storage = firebase.storage;
export const googleProvider = firebase.googleProvider;

export default firebase;

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