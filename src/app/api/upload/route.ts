import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin SDK 초기화
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const subType = formData.get('subType') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 파일 데이터를 Buffer로 변환
    const buffer = Buffer.from(await file.arrayBuffer());

    // 파일 이름 생성
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `farmers/${timestamp}_${cleanFileName}`;

    // 파일 업로드
    const fileUpload = bucket.file(fileName);
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true
    });

    // 공개 URL 생성
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return NextResponse.json({ url: publicUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 