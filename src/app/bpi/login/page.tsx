
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useBpiLinking } from '@/lib/bpi';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { useToast } from '@/hooks/use-toast';
import { Info, ShieldCheck, Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSavingsStore } from '@/stores/savings-store';
import { useMemo } from 'react';

export default function BpiLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { link } = useBpiLinking();
  const { linkAccount, fetchSampleData, syncCount } = useBpiTrackPlanStore();
  const [selectedAccountType, setSelectedAccountType] = useState('mysaveup');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { savingsEvents } = useSavingsStore();

  const availableSavings = useMemo(() => {
    return savingsEvents.filter((e) => !e.transferredToBank).reduce((s, e) => s + e.amount, 0);
  }, [savingsEvents]);


  const handleConnect = () => {
    setIsLoading(true);

    setTimeout(() => {
      // In a real app, this would be a multi-step OAuth flow.
      // Here, we simulate the end result.
      link(['accounts.read', 'track_plan.read', 'transfers.create']);
      linkAccount();
      fetchSampleData();
      setIsLoading(false);
      setIsSuccess(true);
      
      toast({
          title: "BPI Account Linked!",
          description: `You can now access BPI features. Sync Count: ${syncCount + 1}.`,
      });

      setTimeout(() => {
        router.push('/bpi/dashboard');
      }, 1500);

    }, 2000);
  };

  return (
    <div className="bg-gray-50 min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center border-t-4 border-primary">
            <div className="flex items-center justify-center gap-4 mb-6">
                <Image src="/scrapless_logo_green.png" alt="Scrapless Logo" width={50} height={50} />
                <LinkIcon className="text-gray-400 w-7 h-7" />
                <Image src="/bpi-logo.png" alt="BPI Logo" width={50} height={50} className="bg-white rounded-lg p-1 border" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">Connect BPI Account</h1>
            <p className="text-gray-500 mb-6">Turn your food waste savings into real money in your BPI account.</p>

            <div className="bg-green-50/70 border-2 border-green-100 rounded-xl p-4 mb-6">
                <div className="text-3xl font-bold text-primary">₱{availableSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-sm text-green-800">Ready to transfer to your account</p>
            </div>

            <div className="space-y-3 mb-6 text-left">
                 <div 
                    className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedAccountType === 'saveup' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-primary/50'
                    )}
                    onClick={() => setSelectedAccountType('saveup')}
                 >
                    <p className="font-bold text-gray-800">#saveup Digital Account</p>
                    <p className="text-sm text-gray-600">Instant transfers • No minimum balance</p>
                 </div>
                 <div 
                    className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedAccountType === 'mysaveup' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50 hover:border-primary/50'
                    )}
                    onClick={() => setSelectedAccountType('mysaveup')}
                 >
                    <p className="font-bold text-gray-800">#mysaveup Goal-Based Account</p>
                    <p className="text-sm text-gray-600">Set savings goals • Higher interest</p>
                 </div>
            </div>

            <Button 
                className="w-full h-14 text-lg font-semibold rounded-full" 
                onClick={handleConnect} 
                disabled={isLoading || isSuccess}
            >
                {isLoading ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                ) : isSuccess ? (
                    <CheckCircle className="w-6 h-6 mr-2" />
                ) : (
                    <ShieldCheck className="w-6 h-6 mr-2" />
                )}
                {isLoading ? 'Connecting to BPI...' : isSuccess ? 'Successfully Connected!' : 'Connect Securely'}
            </Button>

             <div className="text-xs text-gray-500 mt-6 p-4 bg-gray-100 rounded-lg text-left flex items-start gap-2">
                <Info className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  This is a developer demo using a simulated login. Your credentials are not stored. You can disconnect this integration at any time from your profile.
                </div>
            </div>

        </div>
    </div>
  );
}
