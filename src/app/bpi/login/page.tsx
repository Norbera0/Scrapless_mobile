
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useBpiLinking } from '@/lib/bpi';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function BpiLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { state, link, unlink } = useBpiLinking();
  const { isLinked: isTrackPlanLinked, linkAccount, fetchMockData, unlinkAccount, syncCount } = useBpiTrackPlanStore();

  const [consent, setConsent] = useState(false);
  const [scopes, setScopes] = useState<string[]>(['accounts.read', 'track_plan.read']);

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleLink = () => {
    if (!consent) return;
    // Link main BPI account
    link(scopes);
    // Link mock Track & Plan
    linkAccount();
    fetchMockData();

    toast({
        title: "Mock BPI Account Linked!",
        description: `Sample Track & Plan data fetched. Sync ${syncCount + 1} time(s) for evolving insights.`,
    });
    router.push('/bpi/dashboard');
  };

  const handleUnlink = () => {
    unlink();
    unlinkAccount();
    toast({
        title: "Mock BPI Account Unlinked",
        description: "Sample data has been cleared.",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mock BPI Login & Permissions</CardTitle>
        <CardDescription>Authenticate and grant read access to accounts, balances, and Track & Plan spending data. This is a non-production demo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Hackathon Demo</AlertTitle>
          <AlertDescription>
            This is a simulated login. No real data is used or shared. The mock data will "evolve" with more syncs to mimic BPI's learning feature.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('accounts.read')} onCheckedChange={() => toggleScope('accounts.read')} /> Read accounts & balances</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('transactions.read')} onCheckedChange={() => toggleScope('transactions.read')} /> Read transactions</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('transfers.create')} onCheckedChange={() => toggleScope('transfers.create')} /> Create transfers (sandbox)</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={scopes.includes('track_plan.read')} onCheckedChange={() => toggleScope('track_plan.read')} /> Access Track & Plan spending data</label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(Boolean(v))} /> I consent to securely share selected data for the purpose of sustainability-linked features.
        </label>
        <div className="flex gap-2">
          <Button onClick={handleLink} disabled={!consent}>Continue</Button>
          {(state.isLinked || isTrackPlanLinked) && (
            <Button variant="secondary" onClick={handleUnlink}>Unlink</Button>
          )}
        </div>
         {(state.isLinked || isTrackPlanLinked) && (
            <div className="flex gap-2">
                 <Button variant="outline" onClick={fetchMockData}>Sync Track & Plan (Mock)</Button>
                 <p className="text-sm text-muted-foreground self-center">Syncs: {syncCount} (More details after 3)</p>
            </div>
         )}
      </CardContent>
    </Card>
  );
}
