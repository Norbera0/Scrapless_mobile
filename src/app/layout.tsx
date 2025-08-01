
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider } from '@/components/ui/sidebar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { isLoading } = useAuth();
  
  const isAuthPage = pathname === '/login';

  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster />
        {isAuthPage || isLoading ? (
            children
        ) : (
          <SidebarProvider>{children}</SidebarProvider>
        )}
      </body>
    </html>
  );
}
