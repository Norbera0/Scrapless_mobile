
'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Sidebar, SidebarInset, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar';
import { initializeUserCache } from '@/lib/data';
import { FloatingChatAssistant } from '@/components/assistant/FloatingChatAssistant';
import { Button } from '@/components/ui/button';
import { PanelLeft, Bell, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNotifications } from '@/hooks/use-notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationPanel } from '@/components/dashboard/NotificationPanel';
import { useGreenPointsStore } from '@/stores/green-points-store';
import Image from 'next/image';
import Link from 'next/link';
import { ExpiredItemsDialog } from '@/components/pantry/ExpiredItemsDialog';


const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/pantry')) return 'Pantry';
    if (pathname.startsWith('/log-waste')) return 'Log Waste';
    if (pathname.startsWith('/add-to-pantry')) return 'Add to Pantry';
    if (pathname.startsWith('/my-waste')) return 'My Waste';
    if (pathname.startsWith('/kitchen-coach')) return 'Kitchen Coach';
    if (pathname.startsWith('/shopping')) return 'Shopping Hub';
    if (pathname.startsWith('/my-savings')) return 'My Savings';
    if (pathname.startsWith('/review-items')) return 'Review Items';
    if (pathname.startsWith('/review-pantry-items')) return 'Review Pantry Items';
    if (pathname.startsWith('/profile')) return 'Profile';
    if (pathname.startsWith('/rewards')) return 'Green Points';
    return 'Scrapless';
}


export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { notifications, totalNew, priorityColor } = useNotifications();
  const [hasOpenedNotifications, setHasOpenedNotifications] = useState(false);
  const { events: greenPointsEvents } = useGreenPointsStore();
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const totalGreenPoints = useMemo(() => {
    return greenPointsEvents.reduce((acc, event) => acc + event.points, 0);
  }, [greenPointsEvents]);

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

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
  
  const badgeColorClass = {
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      gray: 'bg-gray-400',
  }[priorityColor];


  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarNav user={user} />
          <SidebarRail />
        </Sidebar>
        <div className="flex-1 flex flex-col">
            <header className="flex-shrink-0 flex h-14 items-center gap-4 bg-primary text-primary-foreground px-4 sm:h-16 sm:px-6 sticky top-0 z-10 shadow-[inset_0_2px_4px_0_rgba(0,0,0,0.1)]">
                <SidebarTrigger className="md:flex hover:bg-white/20" />
                <div className="flex items-center gap-2 md:hidden">
                    <div className="text-xs font-semibold truncate">
                        {greeting}, {user?.name?.split(' ')[0]}
                    </div>
                </div>
                <h1 className="text-lg font-semibold md:text-xl truncate flex-1 hidden md:block">{getPageTitle(pathname)}</h1>
                <div className="flex items-center gap-4 md:gap-6 ml-auto">
                    <Popover>
                    <PopoverTrigger asChild>
                        <div className="hidden md:flex items-center gap-2 bg-white/20 text-white font-semibold px-3 py-1.5 rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
                            <Leaf className="w-4 h-4 text-white" />
                            <span className="text-sm">{totalGreenPoints.toLocaleString()}</span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Green Points</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your points can be converted to rewards in the BPI ecosystem.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href="/rewards">
                                    <Image src="/vybe-logo.png" alt="VYBE Logo" width={20} height={20} className="mr-2" />
                                    Convert via VYBE
                                </Link>
                            </Button>
                        </div>
                    </PopoverContent>
                    </Popover>
                    <div className="hidden md:flex flex-col items-end">
                    <div className="text-sm font-semibold">{format(currentDate, 'eeee, MMMM d')}</div>
                    <div className="text-xs text-white/80">{format(currentDate, 'h:mm a')}</div>
                    </div>
                    <Popover onOpenChange={(open) => {
                    if(open) {
                        setHasOpenedNotifications(true);
                    }
                    }}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative hover:bg-white/20">
                        <Bell className="h-5 w-5" />
                        {totalNew > 0 && !hasOpenedNotifications && (
                            <span className={cn("absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white", badgeColorClass)}>
                                {totalNew > 9 ? '9+' : totalNew}
                            </span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 p-0" align="end">
                        <NotificationPanel notifications={notifications} />
                    </PopoverContent>
                    </Popover>
                    <Link href="/profile" className="flex items-center gap-2 rounded-md p-1 hover:bg-white/10 transition-colors">
                        <div className="hidden sm:flex flex-col items-end text-right">
                            <div className="text-sm font-medium">{user?.name || 'User'}</div>
                            <div className="text-xs text-white/80">{user?.email}</div>
                        </div>
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    </Link>
                </div>
            </header>
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </div>
      <FloatingChatAssistant />
      <ExpiredItemsDialog />
    </SidebarProvider>
  );
}
