'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import LoginModal from '@/components/LoginModal';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoginModalOpen: boolean;
  showLoginModal: () => void;
  hideLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // 비로그인 상태이고 public path가 아닌 경우 로그인 모달 표시
      if (!user && !PUBLIC_PATHS.includes(pathname || '')) {
        setIsLoginModalOpen(true);
      } else {
        setIsLoginModalOpen(false);
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  const showLoginModal = () => setIsLoginModalOpen(true);
  const hideLoginModal = () => setIsLoginModalOpen(false);

  // 로딩 중에는 아무것도 표시하지 않음
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 비로그인 상태이고 public path가 아닌 경우 접근 제한
  if (!user && !PUBLIC_PATHS.includes(pathname || '')) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-600">이 페이지에 접근하려면 로그인이 필요합니다.</p>
          </div>
        </div>
        <LoginModal isOpen={isLoginModalOpen} onClose={hideLoginModal} />
      </>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading,
        isLoginModalOpen,
        showLoginModal,
        hideLoginModal
      }}
    >
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={hideLoginModal} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 