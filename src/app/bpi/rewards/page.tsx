'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BpiRewardsPage() {
  const earners = [
    { label: 'Refillable water + local produce', points: 120 },
    { label: 'Plant-based meals this week', points: 80 },
    { label: 'Bulk rice/grains (zero-waste)', points: 65 },
  ];
  const redemptions = [
    { label: 'Eco tote from partner merchant', points: 150 },
    { label: '5% cash back voucher (green partners)', points: 300 },
    { label: 'P100 statement credit', points: 500 },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">BPI Rewards (Mock)</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent earn</CardTitle>
            <CardDescription>Boosted by sustainable choices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {earners.map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-2">
                <span>{e.label}</span>
                <span className="font-medium">+{e.points} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Redeem options</CardTitle>
            <CardDescription>Eco-friendly redemptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {redemptions.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border p-2">
                <span>{r.label}</span>
                <span className="font-medium">{r.points} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


