
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { Insight, PantryItem, User, WasteLog } from '@/types';
import { getLatestInsight, saveInsight, getExpiredPantryItems, moveExpiredItemsToWaste } from '@/lib/data';
import { analyzeConsumptionPatterns } from '@/ai/flows/analyze-consumption-patterns';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';

const twentyFourHours = 24 * 60 * 60 * 1000;
const oneHour = 60 * 60 * 1000;

const fetchAndSaveNewInsight = async (user: User, wasteLogs: WasteLog[], pantryItems: PantryItem[]) => {
  if (wasteLogs.length === 0 && pantryItems.length === 0) {
    return; // Don't generate insights for users with no data
  }
  
  try {
    const analysisResult = await analyzeConsumptionPatterns({
      userName: user.name?.split(' ')[0] || 'User',
      wasteLogs: wasteLogs,
      pantryItems: pantryItems.map(item => ({
          name: item.name,
          estimatedExpirationDate: item.estimatedExpirationDate,
          estimatedAmount: `${item.quantity} ${item.unit}`,
      })),
    });

    const newInsight: Omit<Insight, 'id'> = {
      ...analysisResult,
      userId: user.uid,
      date: new Date().toISOString(),
      status: 'new',
    };
    
    await saveInsight(newInsight);

  } catch (error) {
    console.error("Failed to generate and save new insight:", error);
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { logs: wasteLogs, logsInitialized } = useWasteLogStore();
  const { liveItems: pantryItems, pantryInitialized } = usePantryLogStore();

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
      const lastInsightCheck = localStorage.getItem(`lastInsightCheck_${user.uid}`);
      const now = new Date().getTime();

      if (!lastInsightCheck || now - parseInt(lastInsightCheck, 10) > twentyFourHours) {
        console.log("Checking for new insights...");
        fetchAndSaveNewInsight(user, wasteLogs, pantryItems);
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
  }, [user, logsInitialized, pantryInitialized, wasteLogs, pantryItems]);


  return { user, isLoading };
}
