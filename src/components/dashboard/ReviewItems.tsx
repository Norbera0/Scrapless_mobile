
'use client';

import { useState } from 'react';
import { useRouter, type NextRouter } from 'next/navigation';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Save, UtensilsCrossed, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WasteLog, FoodItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { saveWasteLog } from '@/lib/data';
import { FOOD_DATA_MAP } from '@/lib/food-data';
import type { WasteLogItem } from '@/stores/waste-log-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const wasteReasons = [
  "Got spoiled/rotten",
  "Past expiry date",
  "Forgot about it",
  "Cooked too much",
  "Portion too big / Couldn’t finish",
  "Bought too much",
  "Plans changed",
  "Other reason"
];

const safelyResetThenNavigate = async (
    resetFn: () => void,
    router: NextRouter,
    path: string
) => {
    // We don't reset the store immediately, so the summary page can access it.
    // The summary page or the next action will be responsible for the reset.
    router.replace(path);
};

export function ReviewItems() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, setItems, photoDataUri, reset, sessionWasteReason, setSessionWasteReason, otherWasteReasonText, setOtherWasteReasonText } = useWasteLogStore();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleItemChange = (index: number, field: keyof WasteLogItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };
  
  const handleAddItem = () => {
    const newItem: WasteLogItem = {
      id: crypto.randomUUID(),
      name: '',
      estimatedAmount: '',
    };
    setItems([...items, newItem]);
  };

  const handleConfirmAndSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        return;
    }
     if (!sessionWasteReason) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a reason for the waste.' });
      return;
    }
    setIsSaving(true);

    try {
      const getImpact = (itemName: string): { peso: number; co2e: number } => {
        const lowerCaseItem = itemName.toLowerCase();
        for (const key in FOOD_DATA_MAP) {
          if (lowerCaseItem.includes(key)) {
            return FOOD_DATA_MAP[key];
          }
        }
        return { peso: 5, co2e: 0.1 }; // Default for unrecognized items
      }

      let totalPesoValue = 0;
      let totalCarbonFootprint = 0;
      
      const reasonToSave = sessionWasteReason === 'Other reason' ? otherWasteReasonText : sessionWasteReason;

      const finalItems: FoodItem[] = items.map(item => {
          const { peso, co2e } = getImpact(item.name);
          totalPesoValue += peso;
          totalCarbonFootprint += co2e;
          return {
              id: item.id,
              name: item.name,
              estimatedAmount: item.estimatedAmount,
              pesoValue: peso,
              carbonFootprint: co2e,
              wasteReason: reasonToSave, // Apply session-level reason
          }
      });
  
      const logData: Omit<WasteLog, 'id'> = {
        date: new Date().toISOString(),
        userId: user.uid,
        items: finalItems,
        totalPesoValue: totalPesoValue,
        totalCarbonFootprint: totalCarbonFootprint,
        sessionWasteReason: reasonToSave,
      };

      if (photoDataUri) {
        logData.photoDataUri = photoDataUri;
      }
      
      await saveWasteLog(logData);

      // Don't show toast, navigate to summary page instead
      router.push('/summary');
      
    } catch (error) {
      console.error('Failed to save waste log items:', error);
      toast({
        title: 'Error',
        description: 'Failed to save items. Please try again.',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
    // No setIsSaving(false) here because we navigate away
  };
  
  if (items.length === 0 && !isSaving) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>No items to review. Log waste to get started.</p>
        <Button onClick={() => router.push('/log-waste?method=camera')} className="mt-4">
          Log Waste
        </Button>
      </div>
    );
  }
  
  const isSaveDisabled = isSaving || items.length === 0 || !sessionWasteReason || (sessionWasteReason === 'Other reason' && !otherWasteReasonText.trim());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detected Waste Items</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              Add more item +
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
             <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-1 items-center gap-4">
                    <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                    <div className="flex-1 grid gap-2">
                    <Input
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="text-lg font-semibold"
                        placeholder="Item Name"
                    />
                    <Input
                        value={item.estimatedAmount}
                        onChange={(e) => handleItemChange(index, 'estimatedAmount', e.target.value)}
                        placeholder="Amount (e.g. 1 cup)"
                    />
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="ml-4"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
           <div className="grid w-full gap-2">
              <Label htmlFor="waste-reason">💭 Why did these items go to waste?</Label>
              <Select value={sessionWasteReason ?? ''} onValueChange={setSessionWasteReason}>
                  <SelectTrigger id="waste-reason">
                      <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                      {wasteReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                          {reason}
                      </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
               {sessionWasteReason === 'Other reason' && (
                <Textarea
                  placeholder="Please specify the reason for the waste..."
                  value={otherWasteReasonText}
                  onChange={(e) => setOtherWasteReasonText(e.target.value)}
                  className="mt-2"
                />
              )}
           </div>
        </CardFooter>
      </Card>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Back
        </Button>
        <Button onClick={handleConfirmAndSave} disabled={isSaveDisabled}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Log'}
        </Button>
      </div>
    </div>
  );
}
