
'use client';
import { PantryDashboard } from '@/components/pantry/PantryDashboard';
import { getPantryItemsForUser } from '@/lib/data';
import { auth } from '@/lib/firebase';
import type { PantryItem, User } from '@/types';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        });
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchItems = async () => {
        setIsLoading(true);
        const userItems = await getPantryItemsForUser(user.uid);
        setItems(userItems);
        setIsLoading(false);
      };
      fetchItems();
    }
  }, [user]);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full p-4 md:p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Virtual Pantry</h1>
        <p className="text-muted-foreground">
          Keep track of your food items to reduce waste.
        </p>
      </div>
      <PantryDashboard initialItems={items} />
    </div>
  );
}
