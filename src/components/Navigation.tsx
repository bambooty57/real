'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              홈
            </Link>
            <Link 
              href="/farmers/new" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/farmers/new' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              농민 등록
            </Link>
            <Link 
              href="/farmers" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/farmers' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              농민 목록
            </Link>
            <Link 
              href="/farmers/trade" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/farmers/trade' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              농기계 거래
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-sm">로딩중...</div>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{session.user?.name || session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 