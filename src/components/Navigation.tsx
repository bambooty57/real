'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

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
              href="/farmers" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/farmers' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              농민 목록
            </Link>
            <Link 
              href="/farmers/new" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/farmers/new' ? 'bg-gray-900' : 'hover:bg-gray-700'
              }`}
            >
              농민 등록
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 