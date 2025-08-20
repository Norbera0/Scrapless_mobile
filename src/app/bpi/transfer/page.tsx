
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { planTransfer } from '@/lib/bpi';
import { useSavingsStore } from '@/stores/savings-store';
import { useSavingsSummary } from '@/lib/bpi';

interface BpiTransferFormProps {
  onTransferComplete?: () => void;
}

export function BpiTransferForm({ onTransferComplete }: BpiTransferFormProps) {
  const router = useRouter();
  const { savingsEvents } = useSavingsStore();
  const { available } = useSavingsSummary(savingsEvents);
  
  const [amount, setAmount] = useState<number>(available);

  const submit = () => {
    if (!amount) return;
    
    // This function updates the state in Zustand store
    planTransfer(amount);

    // In a real app, this would initiate a secure backend process.
    // For this mockup, we navigate to the fake GCash page with the amount.
    router.push(`/GCashRedirect-Mockup?amount=${amount}`);
    if(onTransferComplete) {
        onTransferComplete();
    }
  };

  return (
    <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="amount-input" className="text-sm">Amount (₱)</Label>
          <Input 
            id="amount-input"
            type="number" 
            min={0} 
            max={available} 
            value={amount} 
            onChange={(e) => setAmount(Number(e.target.value))} 
           />
          <div className="mt-1 text-xs text-muted-foreground">Available from eco-savings: ₱{available.toFixed(2)}</div>
        </div>
        <div>
          <Button onClick={submit} disabled={!amount || amount <= 0 || amount > available} className="w-full">Initiate Transfer</Button>
        </div>
    </div>
  );
}

export default function BpiTransferPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Suggest transfer to BPI</CardTitle>
                <CardDescription>Move your eco-savings to your BPI account.</CardDescription>
            </CardHeader>
            <CardContent>
                <BpiTransferForm />
            </CardContent>
        </Card>
    );
}
