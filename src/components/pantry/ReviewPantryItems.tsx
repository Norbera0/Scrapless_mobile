
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Save, UtensilsCrossed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { DatePicker } from '@/components/ui/date-picker';
import type { PantryLogItem } from '@/stores/pantry-store';
import { savePantryItems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';

export function ReviewPantryItems() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, setItems, reset } = usePantryLogStore();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleItemChange = (index: number, field: string, value: any) => {
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
      await savePantryItems(user.uid, items);
      toast({
        title: 'Success!',
        description: 'Your pantry has been updated.',
      });

      reset();
      router.push('/pantry');
      
    } catch (error) {
      console.error('Failed to save pantry items:', error);
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
        <p>No items to review. Add items from the pantry logger.</p>
        <Button onClick={() => router.push('/add-to-pantry')} className="mt-4">
          Add Items
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detected Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item: PantryLogItem, index: number) => {
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      value={item.estimatedAmount}
                       onChange={(e) =>
                        handleItemChange(index, 'estimatedAmount', e.target.value)
                      }
                      placeholder="Amount (e.g. 1kg)"
                    />
                    <DatePicker
                      date={new Date(item.estimatedExpirationDate)}
                      onDateChange={(date) =>
                        handleItemChange(index, 'estimatedExpirationDate', date?.toISOString() ?? new Date().toISOString())
                      }
                    />
                  </div>
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
              Save to Pantry
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will add the reviewed items to your pantry.
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
