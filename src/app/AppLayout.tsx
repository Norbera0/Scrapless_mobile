
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
import { cn } from '@/lib/utils';


const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/pantry')) return 'Pantry';
    if (pathname.startsWith('/log-waste')) return 'Log Waste';
    if (pathname.startsWith('/add-to-pantry')) return 'Add to Pantry';
    if (pathname.startsWith('/my-waste')) return 'My Waste';
    if (pathname.startsWith('/insights')) return 'AI Insights';
    if (pathname.startsWith('/shopping')) return 'Shopping Hub';
    if (pathname.startsWith('/saves')) return 'My Saves';
    if (pathname.startsWith('/review-items')) return 'Review Items';
    if (pathname.startsWith('/review-pantry-items')) return 'Review Pantry Items';
    return 'Scrapless';
}


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
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
            <SidebarTrigger className="md:flex" />
            <h1 className="text-lg font-semibold md:text-xl">{getPageTitle(pathname)}</h1>
            <div className="flex-1">
                 {/* Can add other header items here in the future */}
            </div>
            {/* Add other header items like avatar here if needed */}
        </header>
        {children}
      </SidebarInset>
      <FloatingChatAssistant />
    </SidebarProvider>
  );
}
