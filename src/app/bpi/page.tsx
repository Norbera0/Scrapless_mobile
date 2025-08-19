
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSavingsStore } from '@/stores/savings-store';
import { useBpiLinking, getStoredAccounts, estimateTimeDepositEarnings, useSavingsSummary } from '@/lib/bpi';
import { PiggyBank, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function BpiHubPage() {
  const { state } = useBpiLinking();
  const { savingsEvents } = useSavingsStore();
  const { total, available } = useSavingsSummary(savingsEvents);

  useEffect(() => {
    // warm local storage for accounts on first visit
    getStoredAccounts();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">BPI Integration Hub</h1>
      <p className="text-muted-foreground">Link your BPI account, view eco-linked savings, and explore green products.</p>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Image src="/bpi-logo-2.png" alt="BPI Logo" width={24} height={24} />
              Account linking
            </CardTitle>
            <CardDescription>{state.isLinked ? 'BPI account linked' : 'No BPI account linked'}</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button asChild>
              <Link href="/bpi/mysaveup">{state.isLinked ? 'Manage link' : 'Link BPI account'}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/bpi/dashboard">Sustainability dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Green Saver suggestion</CardTitle>
            <CardDescription>Based on your available eco-savings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Eco-savings available: ₱{available.toFixed(2)} (Total to date: ₱{total.toFixed(2)})</p>
            <p className="mt-2 text-sm">If you place ₱{Math.min(available, 5000).toFixed(0)} in Green Saver for 6 months at 4.25% p.a., estimated interest ≈ ₱{estimateTimeDepositEarnings(Math.min(available, 5000)).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketplace</CardTitle>
            <CardDescription>Eco partner merchants</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/bpi/marketplace">Browse partners</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Goal-based savings</CardTitle>
            <CardDescription>Solar/EV downpayment</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/bpi/goals">Set a goal</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
