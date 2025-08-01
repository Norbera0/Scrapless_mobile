
'use client';

import { Home, Camera, LogOut, BarChart, Warehouse, Bookmark, Bot, Lightbulb, ShoppingCart, Utensils } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import type { User } from '@/types';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners } from '@/lib/data';

export function SidebarNav({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();

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

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/log-waste?method=camera', label: 'Log Waste', icon: Camera },
    { href: '/pantry', label: 'Pantry', icon: Warehouse },
    { href: '/trends', label: 'Trends', icon: BarChart },
    { href: '/insights', label: 'Insights', icon: Lightbulb },
    { href: '/shopping', label: 'Shopping Hub', icon: ShoppingCart },
    { href: '/saves', label: 'My Saves', icon: Bookmark },
  ];
  
  const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  const isActive = (itemHref: string) => {
    const itemBase = itemHref.split('?')[0];
    
    if (pathname === itemBase) return true;

    // Broader match for nested routes
    if (pathname.startsWith(`${itemBase}/`)) return true;
    
    return false;
  }


  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">Scrapless</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                onClick={() => router.push(item.href)}
                isActive={isActive(item.href)}
                className="w-full justify-start text-base h-12"
                tooltip={item.label}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarSeparator />
        <div className="flex items-center gap-3 p-2">
          <Avatar>
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-semibold text-sm truncate">{user.name || 'User'}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </>
  );
}
