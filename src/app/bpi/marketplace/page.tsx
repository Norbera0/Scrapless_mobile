'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const partners = [
  { name: 'EcoGrocer', cashback: '5% BPI Card', desc: 'Organic & local produce' },
  { name: 'Refill PH', cashback: '8% BPI Card', desc: 'Refillable home essentials' },
  { name: 'SolarStarter', cashback: '₱500 back', desc: 'Home solar consultation fee credit' },
];

export default function BpiMarketplacePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Green Product Marketplace (Mock)</h1>
      <Card>
        <CardHeader>
          <CardTitle>Featured partners</CardTitle>
          <CardDescription>Maximize rewards with BPI Cards</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {partners.map((p) => (
            <div key={p.name} className="rounded-md border p-3">
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">{p.desc}</div>
              <div className="mt-2 text-sm font-semibold">Offer: {p.cashback}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}


