'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          console.log('Login successful:', result.user);
          router.push('/');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    };

    checkRedirectResult();
  }, [router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithRedirect(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            로그인
          </h2>
        </div>
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-md text-center">
            {error}
          </div>
        )}
        <div className="mt-8 space-y-6">
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              isLoading 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            <FaGoogle className="w-5 h-5 mr-2 text-red-500" />
            {isLoading ? '로그인 중...' : 'Google 계정으로 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
} 