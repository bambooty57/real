import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountStr = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '', 
      'base64'
    ).toString('utf-8');
    
    const serviceAccount = JSON.parse(serviceAccountStr);

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error('Storage bucket is not configured');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket
    });

    console.log('Firebase Admin SDK initialized successfully');

  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminDB = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage().bucket(); 