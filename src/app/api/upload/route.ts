import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

const BUCKET_NAME = 'real-81ba6.firebasestorage.app';
const bucket = adminStorage.bucket(BUCKET_NAME);

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

      // 공개 URL 생성
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