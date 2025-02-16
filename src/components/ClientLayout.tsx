'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { SearchFilterProvider } from '@/contexts/SearchFilterContext';
import Navigation from '@/components/Navigation';
import { Toaster } from 'react-hot-toast';
import ScriptLoader from './ScriptLoader';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScriptLoader />
      <AuthProvider>
        <SearchFilterProvider>
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </SearchFilterProvider>
      </AuthProvider>
      <Toaster />
    </>
  );
} 