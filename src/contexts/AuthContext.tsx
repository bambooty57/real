'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authAttempts = useRef(0);
  const maxAuthAttempts = 3;

  useEffect(() => {
    if (status === 'loading') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (session?.user?.email && !firebaseUser && !isAuthenticating && authAttempts.current < maxAuthAttempts) {
        try {
          setIsAuthenticating(true);
          authAttempts.current += 1;
          
          const response = await fetch('/api/auth/firebase-token');
          if (!response.ok) {
            throw new Error('Failed to get Firebase token');
          }
          const { token } = await response.json();
          await signInWithCustomToken(auth, token);
          
          // 성공하면 시도 횟수 초기화
          authAttempts.current = 0;
        } catch (error) {
          console.error('Firebase auth error:', error);
          if (authAttempts.current >= maxAuthAttempts) {
            console.log('Max auth attempts reached');
          }
        } finally {
          setIsAuthenticating(false);
        }
      }

      console.log('Auth Context State Changed:', {
        isAuthenticated: !!firebaseUser,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified,
        uid: firebaseUser?.uid,
        session: !!session,
        sessionStatus: status
      });
      
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      authAttempts.current = 0;
    };
  }, [session, status, isAuthenticating]);

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