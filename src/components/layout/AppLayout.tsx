'use client';

import React from 'react';
import Sidebar from './Sidebar';
import GlobalFilterBar from './GlobalFilterBar';
import { DataProvider } from '@/lib/context/DataContext';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <div className="min-h-screen bg-[#FAFAF8] text-neutral-900 flex flex-col md:flex-row antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <GlobalFilterBar />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">{children}</main>
        </div>
        <ChatbotWidget />
      </div>
    </DataProvider>
  );
}
