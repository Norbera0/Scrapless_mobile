
'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { initializeUserCache } from '@/lib/data';
import { FloatingChatAssistant } from '@/components/assistant/FloatingChatAssistant';


export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
    if (user) {
        initializeUserCache(user.uid);
    }
  }, [user, isLoading, router, pathname]);
  
  const isAuthPage = pathname === '/login';

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
      return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav user={user} />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
      <FloatingChatAssistant />
    </SidebarProvider>
  );
}
