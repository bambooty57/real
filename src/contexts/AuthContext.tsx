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
  const lastTokenRefresh = useRef<number>(0);
  const tokenRefreshInterval = 5 * 60 * 1000; // 5분

  const getFirebaseToken = async () => {
    try {
      const now = Date.now();
      if (now - lastTokenRefresh.current < tokenRefreshInterval) {
        return null;
      }
      
      const response = await fetch('/api/auth/firebase-token');
      if (!response.ok) {
        console.error('Firebase token fetch failed:', response.status);
        return null;
      }
      const data = await response.json();
      lastTokenRefresh.current = now;
      return data.token;
    } catch (error) {
      console.error('Firebase token error:', error);
      return null;
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (session?.user?.email && !firebaseUser && !isAuthenticating && authAttempts.current < maxAuthAttempts) {
        try {
          setIsAuthenticating(true);
          authAttempts.current += 1;
          
          const token = await getFirebaseToken();
          if (!token) {
            throw new Error('Failed to get Firebase token');
          }
          await signInWithCustomToken(auth, token);
          
          authAttempts.current = 0;
        } catch (error) {
          console.error('Firebase auth error:', error);
          if (authAttempts.current >= maxAuthAttempts) {
            console.warn('Max auth attempts reached');
          }
        } finally {
          setIsAuthenticating(false);
        }
      }

      // 상태가 실제로 변경된 경우에만 로그 출력
      if (user?.uid !== firebaseUser?.uid || user?.email !== firebaseUser?.email) {
        console.log('Auth State Changed:', {
          isAuthenticated: !!firebaseUser,
          email: firebaseUser?.email,
          emailVerified: firebaseUser?.emailVerified,
          uid: firebaseUser?.uid
        });
      }
      
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      authAttempts.current = 0;
    };
  }, [session, status, isAuthenticating, user]);

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