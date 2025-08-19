
'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getStoredAccounts, planTransfer } from '@/lib/bpi';
import { useSavingsStore } from '@/stores/savings-store';
import { useSavingsSummary } from '@/lib/bpi';

interface BpiTransferFormProps {
  onTransferComplete?: () => void;
}

export function BpiTransferForm({ onTransferComplete }: BpiTransferFormProps) {
  const router = useRouter();
  const accounts = getStoredAccounts();
  const { savingsEvents } = useSavingsStore();
  const { available } = useSavingsSummary(savingsEvents);
  
  const [amount, setAmount] = useState<number>(available);
  const [fromId, setFromId] = useState(accounts.find(a => a.type === 'Savings')?.id || accounts[0]?.id);
  const [toId, setToId] = useState(accounts.find(a => a.name.includes('Green'))?.id || accounts[1]?.id);

  const submit = () => {
    if (!amount || !fromId || !toId) return;
    planTransfer(amount, fromId, toId);
    if(onTransferComplete) {
        onTransferComplete();
    } else {
        router.push('/bpi/dashboard');
    }
  };

  return (
    <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label className="text-sm">From account</Label>
          <select className="w-full rounded-md border p-2 text-sm bg-background" value={fromId} onChange={(e) => setFromId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} • {a.maskedNumber}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm">To account</Label>
          <select className="w-full rounded-md border p-2 text-sm bg-background" value={toId} onChange={(e) => setToId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} • {a.maskedNumber}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-sm">Amount (₱)</Label>
          <Input type="number" min={0} max={available} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <div className="mt-1 text-xs text-muted-foreground">Available from eco-savings: ₱{available.toFixed(2)}</div>
        </div>
        <div>
          <Button onClick={submit} disabled={!amount} className="w-full">Create transfer suggestion</Button>
        </div>
    </div>
  );
}

export default function BpiTransferPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Suggest transfer to Green Saver</CardTitle>
                <CardDescription>Move eco-savings into your BPI Green Saver Time Deposit</CardDescription>
            </CardHeader>
            <CardContent>
                <BpiTransferForm />
            </CardContent>
        </Card>
    );
}
