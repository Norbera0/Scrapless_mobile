
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
import { PanelLeft, Bell } from 'lucide-react';
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
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
        <Sidebar>
          <SidebarNav user={user} />
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="flex-1 w-full max-w-full overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6 w-full max-w-full">
              <SidebarTrigger className="md:flex" />
              <h1 className="text-lg font-semibold md:text-xl truncate flex-1">{getPageTitle(pathname)}</h1>
              <div className="flex items-center gap-2 md:gap-4">
                {pathname === '/dashboard' && (
                  <div className="flex flex-col items-end text-right">
                    <div className="text-xs md:text-sm font-medium">
                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                )}
                 <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </Button>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <div className="text-sm font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
              </div>
          </header>
          <div className="bg-background w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </SidebarInset>
      </div>
      <FloatingChatAssistant />
    </SidebarProvider>
  );
}
