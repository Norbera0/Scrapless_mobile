
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Save, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WasteLog, FoodItem } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { saveWasteLog } from '@/lib/data';
import { FOOD_DATA_MAP } from '@/lib/food-data';
import type { WasteLogItem } from '@/stores/waste-log-store';

export function ReviewItems() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, setItems, photoDataUri, reset } = useWasteLogStore();
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

  const handleConfirmAndSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
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
          }
      });
  
      const logData: Omit<WasteLog, 'id'> = {
        date: new Date().toISOString(),
        userId: user.uid,
        items: finalItems,
        totalPesoValue: totalPesoValue,
        totalCarbonFootprint: totalCarbonFootprint,
        ...(photoDataUri && { photoDataUri }),
      };
      
      await saveWasteLog(logData);

      toast({
          title: 'Success!',
          description: 'Your waste log has been saved.',
      });
      
      reset();
      router.replace('/dashboard');
      
    } catch (error) {
      console.error('Failed to save waste log items:', error);
      toast({
        title: 'Error',
        description: 'Failed to save items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No items to review. Log waste to get started.</p>
        <Button onClick={() => router.push('/log-waste?method=camera')} className="mt-4">
          Log Waste
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detected Waste Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            return (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 rounded-lg border p-4 md:grid-cols-3"
              >
                <div className="flex items-center gap-4 md:col-span-1">
                  <UtensilsCrossed className="h-6 w-6 text-muted-foreground" />
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(index, 'name', e.target.value)
                    }
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="md:col-span-2">
                    <Input
                      value={item.estimatedAmount}
                      onChange={(e) =>
                        handleItemChange(index, 'estimatedAmount', e.target.value)
                      }
                      placeholder="Amount (e.g. 1 cup)"
                    />
                </div>
                 <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto -mt-12 -mr-2"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSaving}
        >
          Back
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isSaving || items.length === 0}>
              <Save className="mr-2 h-4 w-4" />
              Save Log
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will save the reviewed waste log to your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAndSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm & Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
