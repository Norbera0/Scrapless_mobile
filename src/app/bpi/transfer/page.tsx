
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
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface BpiTransferFormProps {
  onTransferComplete?: () => void;
}

export function BpiTransferForm({ onTransferComplete }: BpiTransferFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { savingsEvents } = useSavingsStore();
  const { available } = useSavingsSummary(savingsEvents);
  
  const [amount, setAmount] = useState<number>(available);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!amount || !user) return;
    setIsSubmitting(true);
    
    try {
        await planTransfer(user.uid, amount);
        router.push(`/GCashRedirect-Mockup?amount=${amount}`);
        if(onTransferComplete) {
            onTransferComplete();
        }
    } catch (error) {
        console.error("Transfer failed", error);
        // Add a toast notification for the user
    } finally {
        setIsSubmitting(false);
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
          <Button onClick={submit} disabled={!amount || amount <= 0 || amount > available || isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initiate Transfer
          </Button>
        </div>
    </div>
  );
}

export default function BpiTransferPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Suggest a Transfer</CardTitle>
                <CardDescription>Move your eco-savings to your BPI account.</CardDescription>
            </CardHeader>
            <CardContent>
                <BpiTransferForm />
            </CardContent>
        </Card>
    );
}
