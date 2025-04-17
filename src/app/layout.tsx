// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/Layout/MainLayout';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Element Games v5', // Default title
  description: 'Unblocked Games, Tools, Proxy and More',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        {/* Add head element if not present */}
        <head>
            {/* Default Favicon Link - make sure favicon.ico exists in /public */}
            <link rel="icon" href="/favicon.png" sizes="any" />
            {/* Add other meta tags or links here */}
        </head>
      <body className={inter.className}>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}