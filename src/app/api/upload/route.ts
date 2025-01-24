import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

const BUCKET_NAME = 'real-81ba6.firebasestorage.app';

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
  try {
    const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!base64Credentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
    }

    let serviceAccount;
    try {
      const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString();
      serviceAccount = JSON.parse(decodedCredentials);
    } catch (error) {
      throw new Error('Failed to decode or parse service account credentials: ' + error.message);
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

const storage = getStorage();
const bucket = storage.bucket();

// 버킷 존재 여부 확인
async function ensureBucketExists() {
  try {
    const [exists] = await bucket.exists();
    if (!exists) {
      console.error('Storage bucket does not exist');
      throw new Error('Storage bucket not found');
    }
  } catch (error) {
    console.error('Error checking bucket:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // Content-Type 확인
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 버킷 존재 여부 확인
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.error(`Storage bucket ${BUCKET_NAME} does not exist`);
        return NextResponse.json({ error: 'Storage bucket not found' }, { status: 500 });
      }
    } catch (error) {
      console.error('Error checking bucket:', error);
      return NextResponse.json({ error: 'Error checking storage bucket' }, { status: 500 });
    }

    // 파일 데이터를 Buffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // 파일 이름 생성
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `farmers/${timestamp}_${cleanFileName}`;

    // 파일 업로드
    const fileUpload = bucket.file(fileName);
    
    try {
      await fileUpload.save(buffer, {
        metadata: {
          contentType: file.type,
        },
        public: true
      });

      // 공개 URL 생성 - 정확한 도메인 사용
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media`;
      console.log('File uploaded successfully:', publicUrl);
      
      return NextResponse.json({ 
        success: true,
        url: publicUrl 
      });

    } catch (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json({ 
        error: 'File upload failed',
        details: uploadError instanceof Error ? uploadError.message : String(uploadError)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Request processing error:', error);
    return NextResponse.json({ 
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 