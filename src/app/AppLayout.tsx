'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Sidebar, SidebarInset, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar';
import { initializeUserCache } from '@/lib/data';
import { FloatingChatAssistant } from '@/components/assistant/FloatingChatAssistant';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';


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
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <div className="flex items-center gap-2">
                <SidebarTrigger>
                    <PanelLeft />
                </SidebarTrigger>
            </div>
            <div className="flex-1">
                 {/* Can add page titles here in the future */}
            </div>
            {/* Add other header items like avatar here if needed */}
        </header>
        {children}
      </SidebarInset>
      <FloatingChatAssistant />
    </SidebarProvider>
  );
}
