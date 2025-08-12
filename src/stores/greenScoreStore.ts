
// New file: src/stores/greenScoreStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useWasteLogStore } from './waste-log-store';
import { usePantryLogStore } from './pantry-store';
import { useSavingsStore } from './savings-store';
import { useInsightStore } from './insight-store';
import { differenceInDays, startOfToday, parseISO } from 'date-fns';

interface GreenScoreState {
  score: number;
  breakdown: { 
    behavioral: number; 
    financial: number; 
    engagement: number;
    useRatePoints: number;
    wastePenalty: number;
    savingsRatioPoints: number;
    solutionPoints: number;
    consistencyPoints: number;
    streakPoints: number;
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
        useRatePoints: 0,
        wastePenalty: 0,
        savingsRatioPoints: 0,
        solutionPoints: 0,
        consistencyPoints: 0,
        streakPoints: 0,
      },
      badges: [],
      calculateScore: () => {
        const wasteLogs = useWasteLogStore.getState().logs;
        const { archivedItems } = usePantryLogStore.getState();
        const totalSavings = useSavingsStore.getState().totalSavings;
        const { insights } = useInsightStore.getState();

        if (archivedItems.length < 3 && wasteLogs.length < 3) {
            set({ score: 350, badges: ['Newbie'], breakdown: get().breakdown });
            return;
        }

        // --- Behavioral Efficiency (60% = up to 420 points) ---
        const usedItemsCount = archivedItems.filter(i => i.status === 'used').length;
        const wastedItemsCount = archivedItems.filter(i => i.status === 'wasted').length;
        const totalArchived = usedItemsCount + wastedItemsCount;
        
        const useRate = totalArchived > 0 ? (usedItemsCount / totalArchived) : 0;
        const useRatePoints = Math.round(useRate * 300);

        const meatWasteCount = wasteLogs.filter(log => log.items.some(i => i.name.toLowerCase().includes('meat') || i.name.toLowerCase().includes('beef') || i.name.toLowerCase().includes('pork') || i.name.toLowerCase().includes('chicken'))).length;
        const wastePenalty = meatWasteCount * 25; // -25 for each meat waste log

        const behavioral = useRatePoints - wastePenalty;

        // --- Financial Discipline (25% = up to 175 points) ---
        const totalWasteValue = wasteLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const savingsRatio = totalWasteValue > 0 ? totalSavings / totalWasteValue : 1;
        const savingsRatioPoints = Math.min(100, Math.round(savingsRatio * 100));
        
        const committedSolutions = insights.filter(i => i.status === 'acted_on').length;
        const solutionPoints = Math.min(75, committedSolutions * 25);
        
        const financial = savingsRatioPoints + solutionPoints;

        // --- Engagement & Consistency (15% = up to 105 points) ---
        const logDates = wasteLogs.map(log => startOfToday(parseISO(log.date)));
        const uniqueLogDays = new Set(logDates.map(d => d.toISOString())).size;
        const consistencyPoints = Math.min(75, uniqueLogDays * 5);

        const lastLogDate = wasteLogs.length > 0 ? startOfToday(parseISO(wasteLogs[0].date)) : new Date();
        const daysSinceLastWaste = differenceInDays(startOfToday(), lastLogDate);
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
                useRatePoints: Math.round(useRatePoints),
                wastePenalty: Math.round(wastePenalty),
                savingsRatioPoints: Math.round(savingsRatioPoints),
                solutionPoints: Math.round(solutionPoints),
                consistencyPoints: Math.round(consistencyPoints),
                streakPoints: Math.round(streakPoints),
            } 
        });
      },
    }),
);
