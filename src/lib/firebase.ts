'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, getDocs, limit } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBeyOizoucfFuq5LBnqAjglByPisZrhotk",
  authDomain: "real-81ba6.firebaseapp.com",
  projectId: "real-81ba6",
  storageBucket: "real-81ba6.appspot.com",
  messagingSenderId: "858648154763",
  appId: "1:858648154763:web:22b17451a05339ccfafa8e",
  measurementId: "G-B0PZ5GL0EQ"
};

// Firebase 초기화
let firebaseInstance: any = null;

function initializeFirebase() {
  if (firebaseInstance) {
    return firebaseInstance;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    auth.useDeviceLanguage();
    const db = getFirestore(app);
    const storage = getStorage(app, firebaseConfig.storageBucket);
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