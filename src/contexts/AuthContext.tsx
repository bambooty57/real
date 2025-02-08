'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useSession } from 'next-auth/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (session && !user) {
        try {
          // 세션이 있지만 Firebase 사용자가 없는 경우
          const response = await fetch('/api/auth/firebase-token');
          const { token } = await response.json();
          await signInWithCustomToken(auth, token);
        } catch (error) {
          console.error('Firebase auth error:', error);
        }
      }

      console.log('Auth Context State Changed:', {
        isAuthenticated: !!user,
        email: user?.email,
        emailVerified: user?.emailVerified,
        uid: user?.uid,
        session: !!session,
        sessionStatus: status
      });
      
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [session, status]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 