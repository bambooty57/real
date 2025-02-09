import { adminStorage } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

// adminStorage는 이미 버킷 인스턴스이므로 .bucket() 호출 제거
const BUCKET_NAME = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export async function POST(request: Request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const farmerId = formData.get('farmerId') as string;
    const category = formData.get('category') as string;
    
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }
    
    if (!farmerId || !category) {
      return new Response('Missing farmerId or category', { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `farmers/${farmerId}/${category}/${timestamp}-${cleanFileName}`;
    
    console.log('Uploading file:', {
      filePath,
      contentType: file.type,
      size: buffer.length,
      userEmail: session.user.email,
      bucket: adminStorage.name
    });

    // 버킷 존재 여부 확인
    const [exists] = await adminStorage.exists();
    console.log('Bucket exists:', exists);

    const file_obj = adminStorage.file(filePath);
    await file_obj.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: session.user.email,
          uploadedAt: new Date().toISOString()
        }
      },
    });

    const [url] = await file_obj.getSignedUrl({
      action: 'read',
      expires: '03-01-2500'
    });

    return new Response(JSON.stringify({ url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response('Upload failed: ' + (error as Error).message, { status: 500 });
  }
}