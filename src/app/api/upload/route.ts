import { adminStorage } from '@/lib/firebase-admin';

// adminStorage는 이미 버킷 인스턴스이므로 .bucket() 호출 제거
const BUCKET_NAME = 'real-81ba6.firebasestorage.app';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;
    
    await adminStorage.file(fileName).save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET_NAME}/o/${encodeURIComponent(fileName)}?alt=media`;
    
    return new Response(JSON.stringify({ url: fileUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Upload failed', { status: 500 });
  }
}