import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { adminAuth } from '@/lib/firebase-admin';
import { createHash } from 'crypto';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.error('No session or email found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 이메일 주소를 해시하여 고유한 UID 생성
    const uid = createHash('sha256')
      .update(session.user.email)
      .digest('hex')
      .substring(0, 28); // Firebase UID는 최대 128바이트

    console.log('Creating token for user:', {
      email: session.user.email,
      uid: uid
    });

    const token = await adminAuth.createCustomToken(uid);
    
    if (!token) {
      console.error('Failed to create token');
      return NextResponse.json({ error: 'Token creation failed' }, { status: 500 });
    }

    console.log('Token created successfully');
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Firebase token generation error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 