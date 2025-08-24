
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
    User,
    Bot,
    Gift,
    Sparkles,
    ChefHat,
    BarChart2,
    PencilRuler,
    ShieldCheck
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
        // Clean up all Firestore listeners
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
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/pantry', label: 'My Pantry', icon: CookingPot, relatedPaths: ['/add-to-pantry', '/review-pantry-items'] },
    { href: '/analytics', label: 'Analytics', icon: BarChart2, relatedPaths: ['/log-waste', '/review-items', '/summary'] },
    { href: '/cook-shop', label: 'Cook & Shop', icon: ChefHat },
    { href: '/kitchen-coach', label: 'Kitchen Coach', icon: Bot },
  ];
  
  const bpiMenuItems = [
    { href: '/my-savings', label: 'Virtual Savings', icon: PiggyBank },
    { href: '/rewards', label: 'Green Points', icon: Gift },
    { href: '/bpi/green-score', label: 'Green Score', icon: ShieldCheck },
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
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-start gap-3">
          <SidebarTrigger className="md:hidden mr-auto" />
        </div>
        <div className={cn("flex items-center gap-2 mt-2", sidebarState === 'collapsed' && 'hidden')}>
          <Image src="/Scrapless Logo PNG - GREEN2.png" alt="Scrapless Logo" width={32} height={32} />
          <span className="text-xl font-bold">Scrapless</span>
        </div>
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
          <SidebarSeparator />
           <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {}}
                  isSubmenu
                  className="w-full justify-start text-base h-12"
                  tooltip={"BPI Partnership"}
                >
                  <Landmark className="h-5 w-5" />
                  <span>BPI Partnership</span>
                </SidebarMenuButton>
                 <SidebarMenuSub>
                    {bpiMenuItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton 
                                onClick={() => handleNavigation(item.href)}
                                isActive={isActive(item.href)}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                    ))}
                 </SidebarMenuSub>
           </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarSeparator />
        <div 
          className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => handleNavigation('/profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNavigation('/profile')}
        >
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[[data-collapsible=icon]]/sidebar-wrapper:hidden">
            <span className="font-semibold text-sm truncate">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
      </SidebarFooter>
    </>
  );
}
