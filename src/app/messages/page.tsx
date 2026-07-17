'use client';

import { Suspense } from 'react';
import MessagesContent from './MessagesContent';

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center" style={{ backgroundColor: '#1a1b26' }}>
        <div className="animate-spin w-8 h-8 border-4 border-[#0084ff] border-t-transparent rounded-full" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
