
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import type { User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { auth, cleanupFirestore } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { initializeUserCache, cleanupListeners } from '@/lib/data';

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const currentUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        };
        setUser(currentUser);
        // Initialize Firestore listeners for the logged-in user
        initializeUserCache(currentUser.uid);
      } else {
        // User is signed out
        setUser(null);
        // Clean up any active listeners
        cleanupListeners();
        // Optional: clear persistent storage if desired, though Firestore handles this well
        // cleanupFirestore(); 
        router.replace('/login');
      }
      setIsLoading(false);
    });

    return () => {
        unsubscribe();
        // Final cleanup when the layout unmounts
        cleanupListeners();
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
         <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
      </div>
    );
  }
  
  if (!user) {
      return null; // The router will redirect.
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav user={user} />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
