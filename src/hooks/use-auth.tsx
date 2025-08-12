
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import { getExpiredPantryItems, moveExpiredItemsToWaste } from '@/lib/data';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { useExpiryStore } from '@/stores/expiry-store';

const oneHour = 60 * 60 * 1000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logsInitialized } = useWasteLogStore();
  const { pantryInitialized } = usePantryLogStore();
  const { setExpiredItemsToShow } = useExpiryStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && logsInitialized && pantryInitialized) {
      const now = new Date().getTime();
      
      const lastExpiredCheck = localStorage.getItem(`lastExpiredCheck_${user.uid}`);
      const shouldCheck = !lastExpiredCheck || now - parseInt(lastExpiredCheck, 10) > oneHour;

      if (shouldCheck) {
         console.log("Checking for expired items...");
         getExpiredPantryItems(user.uid).then(expiredItems => {
            if (expiredItems.length > 0) {
                console.log(`Found ${expiredItems.length} expired items. Prompting user...`);
                setExpiredItemsToShow(expiredItems);
            }
         });
         localStorage.setItem(`lastExpiredCheck_${user.uid}`, now.toString());
      }
    }
  }, [user, logsInitialized, pantryInitialized, setExpiredItemsToShow]);


  return { user, isLoading };
}
