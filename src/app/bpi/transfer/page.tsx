
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getStoredAccounts, planTransfer } from '@/lib/bpi';
import { useSavingsStore } from '@/stores/savings-store';

export default function BpiTransferPage() {
  const router = useRouter();
  const accounts = getStoredAccounts();
  const { savingsEvents } = useSavingsStore();
  const available = useMemo(() => savingsEvents.filter((e) => !e.transferredToBank).reduce((s, e) => s + e.amount, 0), [savingsEvents]);
  const [amount, setAmount] = useState<number>(Math.min(available, 2000));
  const [fromId, setFromId] = useState(accounts[0]?.id);
  const [toId, setToId] = useState(accounts[1]?.id);

  const submit = () => {
    if (!amount || !fromId || !toId) return;
    planTransfer(amount, fromId, toId);
    router.push('/bpi/dashboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest transfer to Green Saver</CardTitle>
        <CardDescription>Move eco-savings into your BPI Green Saver Time Deposit</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div>
          <Label className="text-sm">From account</Label>
          <select className="mt-1 w-full rounded-md border p-2 text-sm" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} • {a.maskedNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-sm">To account</Label>
          <select className="mt-1 w-full rounded-md border p-2 text-sm" value={toId} onChange={(e) => setToId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} • {a.maskedNumber}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-sm">Amount (₱)</Label>
          <Input type="number" min={0} max={available} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <div className="mt-1 text-xs text-muted-foreground">Available from eco-savings: ₱{available.toFixed(2)}</div>
        </div>
        <div className="md:col-span-3">
          <Button onClick={submit} disabled={!amount}>Create suggestion</Button>
        </div>
      </CardContent>
    </Card>
  );
}
