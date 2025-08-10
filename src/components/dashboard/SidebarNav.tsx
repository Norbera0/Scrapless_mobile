
'use client';

import { 
    LogOut,
    LayoutDashboard,
    CookingPot,
    Trash2,
    Lightbulb,
    ShoppingCart,
    Bookmark,
    PackagePlus,
    PiggyBank,
    Landmark,
    User
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import type { User as UserType } from '@/types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners } from '@/lib/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function SidebarNav({ user }: { user: UserType }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state: sidebarState, setOpenMobile } = useSidebar();

  const handleLogout = async () => {
    try {
        // First, clean up all Firestore listeners
        cleanupListeners();
        // Then, sign out from Firebase Auth
        await signOut(auth);
        // Finally, redirect to the login page
        router.push('/login');
    } catch (error) {
        console.error('Logout failed', error);
    }
  };
  
  const handleNavigation = (href: string) => {
    setOpenMobile(false);
    router.push(href);
  };

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/pantry', label: 'Pantry', icon: CookingPot, relatedPaths: ['/add-to-pantry', '/review-pantry-items'] },
    { href: '/my-waste', label: 'My Waste', icon: Trash2, relatedPaths: ['/log-waste', '/review-items'] },
    { href: '/shopping', label: 'Shopping Hub', icon: ShoppingCart },
    { href: '/insights', label: 'Insights', icon: Lightbulb },
    { href: '/my-savings', label: 'My Savings', icon: PiggyBank },
    { href: '/bpi', label: 'BPI Hub', icon: Landmark, relatedPaths: ['/bpi/login', '/bpi/dashboard', '/bpi/rewards', '/bpi/marketplace', '/bpi/goals', '/bpi/transfer'] },
    { href: '/saves', label: 'My Saves', icon: Bookmark },
  ];

  const bottomMenuItems = [
    { href: '/profile', label: 'Profile', icon: User },
  ];
  
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  const isActive = (itemHref: string, relatedPaths: string[] = []) => {
    const itemBase = itemHref.split('?')[0];
    if (pathname === itemBase || pathname.startsWith(`${itemBase}/`)) return true;
    
    // Check if the current path is one of the related paths
    for (const path of relatedPaths) {
      if (pathname.startsWith(path)) return true;
    }
    
    return false;
  }


  return (
    <>
      <SidebarHeader className="p-4 flex items-center justify-between">
        <div className={cn("flex items-center gap-3", sidebarState === 'collapsed' && 'hidden')}>
          <Image src="/logo.jpg" alt="Scrapless Logo" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold">Scrapless</span>
        </div>
        <SidebarTrigger className="md:hidden" />
      </SidebarHeader>
      <SidebarContent className="p-2 flex-grow">
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  onClick={() => handleNavigation(item.href)}
                  isActive={isActive(item.href, item.relatedPaths)}
                  className="w-full justify-start text-base h-12"
                  tooltip={item.label}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomMenuItems.map((item) => {
             const Icon = item.icon;
             return (
               <SidebarMenuItem key={item.href}>
                 <SidebarMenuButton
                   onClick={() => handleNavigation(item.href)}
                   isActive={isActive(item.href, item.relatedPaths)}
                   className="w-full justify-start text-base h-12"
                   tooltip={item.label}
                 >
                   <Icon className="h-5 w-5" />
                   <span>{item.label}</span>
                 </SidebarMenuButton>
               </SidebarMenuItem>
             );
          })}
        </SidebarMenu>
        <SidebarSeparator />
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[[data-collapsible=icon]]/sidebar-wrapper:hidden">
            <span className="font-semibold text-sm truncate">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2 group-data-[[data-collapsible=icon]]/sidebar-wrapper:justify-center" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className='group-data-[[data-collapsible=icon]]/sidebar-wrapper:hidden'>Log Out</span>
        </Button>
      </SidebarFooter>
    </>
  );
}
