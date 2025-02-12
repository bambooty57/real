'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자가 로그인한 경우
        const token = await user.getIdToken();
        // 토큰을 쿠키에 저장 (7일 유효)
        Cookies.set('firebase-token', token, { expires: 7 });
      } else {
        // 사용자가 로그아웃한 경우
        Cookies.remove('firebase-token');
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <>{children}</>;
} 