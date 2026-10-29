import type { Metadata } from 'next';
import './globals.css';
import AppLayout from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Bekemon',
  description:
    'Visual analytics workspace for advertising agencies comparing creative styles, cartoon campaigns, and performance attribution.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#FAFAF8] text-neutral-900">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
