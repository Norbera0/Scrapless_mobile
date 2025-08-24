
// New file: src/stores/greenScoreStore.ts
import { create } from 'zustand';
import { useWasteLogStore } from './waste-log-store';
import { usePantryLogStore } from './pantry-store';
import { useSavingsStore } from './savings-store';
import { differenceInDays, startOfToday, parseISO } from 'date-fns';

interface GreenScoreState {
  score: number;
  breakdown: { 
    behavioral: number; 
    financial: number; 
    engagement: number;
  };
  badges: string[];
  calculateScore: () => void; // Trigger recalc
}

export const useGreenScoreStore = create<GreenScoreState>(
    (set, get) => ({
      score: 300, // Base
      breakdown: { 
        behavioral: 0, 
        financial: 0, 
        engagement: 0,
      },
      badges: [],
      calculateScore: () => {
        const wasteLogs = useWasteLogStore.getState().logs;
        const { archivedItems } = usePantryLogStore.getState();
        const { savingsEvents } = useSavingsStore.getState();
        const totalSavings = savingsEvents.reduce((sum, e) => sum + e.amount, 0);

        if (archivedItems.length < 3 && wasteLogs.length < 3) {
            set({ score: 350, badges: ['Eco-Starter'], breakdown: { behavioral: 50, financial: 0, engagement: 0 } });
            return;
        }

        // --- Behavioral Efficiency (Max 420 points) ---
        const usedItemsCount = archivedItems.filter(i => i.status === 'used').length;
        const wastedItemsCount = archivedItems.filter(i => i.status === 'wasted').length;
        const totalArchived = usedItemsCount + wastedItemsCount;
        
        const useRate = totalArchived > 0 ? (usedItemsCount / totalArchived) : 0;
        const useRatePoints = Math.round(useRate * 300);

        const highImpactWasteCount = wasteLogs.filter(log => log.items.some(i => i.name.toLowerCase().includes('meat') || i.name.toLowerCase().includes('beef') || i.name.toLowerCase().includes('pork') || i.name.toLowerCase().includes('chicken'))).length;
        const wastePenalty = highImpactWasteCount * 25;

        const behavioral = Math.max(0, useRatePoints - wastePenalty);

        // --- Financial Discipline (Max 175 points) ---
        const totalWasteValue = wasteLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const savingsRatio = totalWasteValue > 0 ? totalSavings / totalWasteValue : 1;
        const savingsRatioPoints = Math.min(100, Math.round(savingsRatio * 100));
        
        const financial = savingsRatioPoints;

        // --- Engagement & Consistency (Max 105 points) ---
        const logDates = wasteLogs.map(log => startOfToday(parseISO(log.date)));
        const uniqueLogDays = new Set(logDates.map(d => d.toISOString())).size;
        const consistencyPoints = Math.min(75, uniqueLogDays * 5);

        let daysSinceLastWaste = 0;
        if(wasteLogs.length > 0) {
            const lastLogDate = startOfToday(parseISO(wasteLogs[0].date));
             daysSinceLastWaste = differenceInDays(startOfToday(), lastLogDate);
        }
       
        const streakPoints = Math.min(30, daysSinceLastWaste * 2);

        const engagement = consistencyPoints + streakPoints;

        const newScore = 300 + behavioral + financial + engagement;
        const cappedScore = Math.max(300, Math.min(1000, newScore));
        
        const newBadges: string[] = [];
        if (cappedScore >= 850) newBadges.push('Eco-Legend');
        else if (cappedScore >= 700) newBadges.push('Eco-Champion');
        else if (cappedScore >= 500) newBadges.push('Eco-Novice');
        if (useRate >= 0.95 && totalArchived > 10) newBadges.push('Pantry Pro');
        if (streakPoints >= 20) newBadges.push('Streak Keeper');

        set({ 
            score: Math.round(cappedScore), 
            badges: newBadges, 
            breakdown: { 
                behavioral: Math.round(behavioral), 
                financial: Math.round(financial), 
                engagement: Math.round(engagement),
            } 
        });
      },
    }),
);
