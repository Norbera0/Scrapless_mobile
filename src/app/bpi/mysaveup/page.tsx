
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useBpiLinking } from '@/lib/bpi';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { useToast } from '@/hooks/use-toast';
import { Info, ShieldCheck, Link as LinkIcon, Loader2, CheckCircle, Landmark } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSavingsStore } from '@/stores/savings-store';
import { useMemo } from 'react';

export default function BpiMySaveUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { link } = useBpiLinking();
  const { linkAccount, fetchSampleData, syncCount } = useBpiTrackPlanStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleConnect = () => {
    setIsLoading(true);

    setTimeout(() => {
      link(['accounts.read', 'track_plan.read', 'transfers.create']);
      linkAccount();
      fetchSampleData();
      setIsLoading(false);
      setIsSuccess(true);
      
      toast({
          title: "BPI #MySaveUp Linked!",
          description: `You can now access savings features.`,
      });

      setTimeout(() => {
        router.push('/my-savings');
      }, 1500);

    }, 2000);
  };

  return (
    <div className="bg-gray-50 min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center border-t-4 border-primary">
            
            <div className="text-5xl mb-5">🏦</div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Connect Your Savings Account</h1>
            <p className="text-gray-500 mb-6 text-sm">
                Link your BPI #MySaveUp to start saving your food waste prevention money
            </p>

            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 mb-8 text-left">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    What you get:
                </h4>
                <ul className="text-sm text-green-700 space-y-2 pl-1">
                    <li>• Automatic transfers to your savings</li>
                    <li>• Track your eco-impact goals</li>
                    <li>• Earn interest on prevented waste</li>
                    <li>• Free transfers via BPI</li>
                </ul>
            </div>

            <Button 
                className="w-full h-14 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90" 
                onClick={handleConnect} 
                disabled={isLoading || isSuccess}
            >
                {isLoading ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                ) : isSuccess ? (
                    <CheckCircle className="w-6 h-6 mr-2" />
                ) : (
                    <LinkIcon className="w-6 h-6 mr-2" />
                )}
                {isLoading ? 'Linking...' : isSuccess ? 'Successfully Linked!' : 'Link BPI #MySaveUp'}
            </Button>

             <div className="text-xs text-yellow-800 mt-6 p-4 bg-yellow-100 rounded-lg text-left flex items-start gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Secure:</strong> We never store your BPI credentials. You can disconnect anytime.
                </div>
            </div>

        </div>
    </div>
  );
}
