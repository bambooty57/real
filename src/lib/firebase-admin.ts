import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountStr = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '', 
      'base64'
    ).toString('utf-8');
    
    console.log('Service Account String:', serviceAccountStr.substring(0, 100) + '...');
    
    const serviceAccount = JSON.parse(serviceAccountStr);
    
    console.log('Parsed Service Account:', {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email
    });

    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!storageBucket) {
      throw new Error('Storage bucket is not configured');
    }

    console.log('Using storage bucket:', storageBucket);

    const config = {
      credential: admin.credential.cert(serviceAccount),
      storageBucket: storageBucket
    };

    console.log('Firebase Admin config:', {
      storageBucket: config.storageBucket,
      hasCredential: !!config.credential
    });

    admin.initializeApp(config);
    console.log('Firebase Admin SDK initialized successfully');

    // 빌드 시에는 버킷 접근 테스트를 건너뜁니다
    if (process.env.NODE_ENV === 'production') {
      const bucket = admin.storage().bucket();
      console.log('Storage bucket initialized:', bucket.name);
    }

  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminDB = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage().bucket(); 