'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { GoogleAuthProvider } from 'firebase/auth';

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyBeyOizoucfFuq5LBnqAjglByPisZrhotk",
  authDomain: "real-81ba6.firebaseapp.com",
  projectId: "real-81ba6",
  storageBucket: "real-81ba6.firebasestorage.app",
  messagingSenderId: "858648154763",
  appId: "1:858648154763:web:22b17451a05339ccfafa8e",
  measurementId: "G-QTHG8GX6EE"
};

// Firebase 초기화를 한 번만 수행
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase 서비스 초기화
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

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
    
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
} 