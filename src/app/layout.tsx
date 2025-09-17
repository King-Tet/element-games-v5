// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/Layout/MainLayout';
import { AuthProvider } from '@/context/AuthContext';
import ClientPage from '@/components/Admin/ClientPage.js';
import Script from 'next/script'; 


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  description: 'Google Calendar is a time-management and scheduling calendar service developed by Google.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
        {/* Add head element if not present */}
        <head>
            {/* Default Favicon Link - make sure favicon.ico exists in /public */}
            <link rel="icon" href="/favicon.ico" sizes="any" />
            {/* Add other meta tags or links here */}
        </head>
      <body className={inter.className}>
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
          <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" />
        <ClientPage />
        </AuthProvider>
        
      </body>
    </html>
  );
}