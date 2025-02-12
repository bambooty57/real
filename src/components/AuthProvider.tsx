'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';
import LoginModal from './LoginModal';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 사용자가 로그인한 경우
        const token = await user.getIdToken();
        // 토큰을 쿠키에 저장 (7일 유효)
        Cookies.set('firebase-token', token, { expires: 7 });
        setIsLoginModalOpen(false);
      } else {
        // 사용자가 로그아웃한 경우
        Cookies.remove('firebase-token');
        setIsLoginModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {children}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </>
  );
} 