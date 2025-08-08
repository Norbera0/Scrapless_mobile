'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useBpiLinking } from '@/lib/bpi';

export default function BpiLoginPage() {
  const router = useRouter();
  const { state, link, unlink } = useBpiLinking();
  const [consent, setConsent] = useState(false);
  const [scopes, setScopes] = useState<string[]>(['accounts.read']);

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleLink = () => {
    if (!consent) return;
    link(scopes);
    router.push('/bpi/dashboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock BPI Login & Permissions</CardTitle>
        <CardDescription>Authenticate and grant read access to accounts and balances. This is a non-production demo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('accounts.read')} onCheckedChange={() => toggleScope('accounts.read')} /> Read accounts & balances</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('transactions.read')} onCheckedChange={() => toggleScope('transactions.read')} /> Read transactions</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('transfers.create')} onCheckedChange={() => toggleScope('transfers.create')} /> Create transfers (sandbox)</label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} /> I consent to securely share selected data for the purpose of sustainability-linked features.
        </label>
        <div className="flex gap-2">
          <Button onClick={handleLink} disabled={!consent}>Continue</Button>
          {state.isLinked && (
            <Button variant="secondary" onClick={() => unlink()}>Unlink</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


