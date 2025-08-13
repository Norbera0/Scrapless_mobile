
'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useSavingsStore } from '@/stores/savings-store';
import { useBpiLinking, getStoredAccounts, greenImpactToSavings, useSavingsSummary } from '@/lib/bpi';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { FinancialWellnessDashboard } from '@/components/insights/FinancialWellnessDashboard';
import type { WasteLog } from '@/types';
import { startOfMonth } from 'date-fns';


const calculateMonthlyWaste = (logs: WasteLog[]): number => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return logs
        .filter(log => new Date(log.date) >= startOfCurrentMonth)
        .reduce((sum, log) => sum + log.totalPesoValue, 0);
};


export default function BpiSustainabilityDashboard() {
  const { state } = useBpiLinking();
  const { savingsEvents } = useSavingsStore();
  const { total, available } = useSavingsSummary(savingsEvents);
  const accounts = getStoredAccounts();

  const { logs } = useWasteLogStore();
  const { isLinked: isBpiLinked, trackPlanData } = useBpiTrackPlanStore();

  const monthlyWaste = useMemo(() => calculateMonthlyWaste(logs), [logs]);
    
  const bpiDiscretionarySpending = useMemo(() => {
      if (!isBpiLinked || !trackPlanData) return 0;
      return trackPlanData.spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [isBpiLinked, trackPlanData]);


  const mockImpact = useMemo(() => {
    // Derive mock eco metrics from recent savings volume
    const co2 = Math.min(500, total / 10); // kg
    const water = Math.min(5000, total * 2); // L
    const food = Math.min(50, total / 50); // kg
    return { co2, water, food };
  }, [total]);

  const conversion = greenImpactToSavings({ co2eKgSaved: mockImpact.co2, waterLitersSaved: mockImpact.water, foodWasteKgReduced: mockImpact.food });

  const progress = Math.min(100, (available / 5000) * 100);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sustainability-linked Savings</h1>
      {!state.isLinked && (
        <Card>
          <CardHeader>
            <CardTitle>Account not linked</CardTitle>
            <CardDescription>Link your BPI account to enable transfers and rewards.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/bpi/login">Link BPI account</Link></Button>
          </CardContent>
        </Card>
      )}

      {isBpiLinked && (
        <div className="mb-8">
            <FinancialWellnessDashboard 
                monthlyWaste={monthlyWaste}
                bpiDiscretionarySpending={bpiDiscretionarySpending}
            />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total eco-savings</CardTitle>
            <CardDescription>Aggregated from Scrapless actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{total.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Available to transfer: ₱{available.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Green impact</CardTitle>
            <CardDescription>Estimated from your actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div>CO₂e avoided: {mockImpact.co2.toFixed(0)} kg</div>
            <div>Water conserved: {mockImpact.water.toFixed(0)} L</div>
            <div>Food waste reduced: {mockImpact.food.toFixed(1)} kg</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Green Saver goal</CardTitle>
            <CardDescription>₱5,000 starter deposit</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="mb-2" />
            <div className="text-sm text-muted-foreground">{progress.toFixed(0)}% of ₱5,000 target</div>
            <div className="mt-2">
              <Button asChild size="sm" variant="secondary"><Link href="/bpi/transfer">Suggest transfer</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>BPI accounts</CardTitle>
            <CardDescription>Mock balances</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-muted-foreground">{a.maskedNumber} • {a.type}</div>
                </div>
                <div className="font-semibold">₱{a.availableBalance.toFixed(2)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Smart suggestions</CardTitle>
            <CardDescription>Financial equivalents</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>Food waste savings equivalent: ₱{conversion.pesoFromFoodWaste.toFixed(2)}</div>
            <div>Water → BPI Rewards points: +{conversion.rewardsFromWater} pts</div>
            <div>CO₂e → potential rate boost suggestion: +{(conversion.rateBoostFromCO2e * 100).toFixed(1)}%</div>
            <Button asChild variant="outline" className="mt-2"><Link href="/bpi/rewards">View rewards</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
