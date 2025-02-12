'use client';

export const dynamic = 'force-dynamic';

import FarmersClient from './FarmersClient';

export default function FarmersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <FarmersClient />
    </div>
  );
}