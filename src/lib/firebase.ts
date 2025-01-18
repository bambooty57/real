'use client';

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBxNPKQxXFHGQXBBGCgBqxXk_1VBWmVrLk",
  authDomain: "real-81ba6.firebaseapp.com",
  projectId: "real-81ba6",
  storageBucket: "real-81ba6.appspot.com",
  messagingSenderId: "1098476322248",
  appId: "1:1098476322248:web:c2c5c6c5c5c5c5c5c5c5c5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app); 