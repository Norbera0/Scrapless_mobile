
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { User } from '@/types';
import { getExpiredPantryItems, moveExpiredItemsToWaste } from '@/lib/data';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { generateNewInsight } from '@/app/actions';

const twelveHours = 12 * 60 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

const fetchAndSaveNewInsight = async (user: User) => {
  try {
    const { isLinked, trackPlanData } = useBpiTrackPlanStore.getState();
    const { logs } = useWasteLogStore.getState();
    const { liveItems } = usePantryLogStore.getState();

    // Prevent generation if there's no data to analyze.
    if (logs.length === 0 && liveItems.length === 0) {
      console.log("Skipping automatic insight generation: No data available.");
      return;
    }
    
    await generateNewInsight(user, {
      pantryItems: liveItems,
      wasteLogs: logs,
      bpiTrackPlanData: isLinked ? trackPlanData : undefined
    });
    console.log("Automatic insight generation successful.");
  } catch (error) {
    console.error("Failed to generate and save new insight automatically:", error);
  }
};


export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logsInitialized } = useWasteLogStore();
  const { pantryInitialized } = usePantryLogStore();

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
      
      const lastInsightCheck = localStorage.getItem(`lastInsightCheck_${user.uid}`);
      if (!lastInsightCheck || now - parseInt(lastInsightCheck, 10) > twelveHours) {
        console.log("Checking for new insights (12-hour interval)...");
        fetchAndSaveNewInsight(user);
        localStorage.setItem(`lastInsightCheck_${user.uid}`, now.toString());
      }
      
      const lastExpiredCheck = localStorage.getItem(`lastExpiredCheck_${user.uid}`);
      if (!lastExpiredCheck || now - parseInt(lastExpiredCheck, 10) > oneHour) {
         console.log("Checking for expired items...");
         getExpiredPantryItems(user.uid).then(expiredItems => {
            if (expiredItems.length > 0) {
                console.log(`Found ${expiredItems.length} expired items. Moving to waste...`);
                moveExpiredItemsToWaste(user.uid, expiredItems);
            }
         });
         localStorage.setItem(`lastExpiredCheck_${user.uid}`, now.toString());
      }
    }
  }, [user, logsInitialized, pantryInitialized]);


  return { user, isLoading };
}
