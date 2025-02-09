import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { adminAuth } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 이메일 주소를 해시하여 고유한 UID 생성
    const uid = createHash('sha256')
      .update(session.user.email)
      .digest('hex')
      .substring(0, 28); // Firebase UID는 최대 128바이트

    const token = await adminAuth.createCustomToken(uid);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Firebase token generation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 