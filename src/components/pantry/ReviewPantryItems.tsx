
'use client';

import { useState, useEffect } from 'react';
import { useRouter, type NextRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Save, UtensilsCrossed, Plus, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DatePicker } from '@/components/ui/date-picker';
import type { PantryLogItem } from '@/stores/pantry-store';
import { savePantryItems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addDays, differenceInDays, startOfToday } from 'date-fns';

const storageLocations = [
  { value: 'counter', label: 'Counter (room temp)' },
  { value: 'pantry', label: 'Pantry/Cabinet' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'freezer', label: 'Freezer' },
];

const useByTimelines = [
  { value: 'today_tomorrow', label: 'Today/Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', 'label': 'Next Week' },
  { value: 'this_month', 'label': 'This Month' },
];

const purchaseSources = [
  { value: 'supermarket', label: 'Supermarket' },
  { value: 'wet_market', label: 'Wet Market/Palengke' },
  { value: 'online', label: 'Online Grocery' },
  { value: 'bulk_store', label: 'Bulk/Wholesale Store' },
  { value: 'home_grown', label: 'Home Grown'},
  { value: 'gift_shared', label: 'Gift/Shared' },
];

const safelyResetThenNavigate = async (
    resetFn: () => void,
    router: NextRouter,
    path: string
) => {
    resetFn();
    await new Promise((res) => setTimeout(res, 20)); 
    router.replace(path);
};

const ItemCard = ({ item, index, handleItemChange, handleRemoveItem }: { item: PantryLogItem, index: number, handleItemChange: Function, handleRemoveItem: Function }) => {
    
    useEffect(() => {
        // Set default storage location if not already set
        if (!item.storageLocation) {
            handleItemChange(index, 'storageLocation', 'counter');
        }
    }, []); // Run only once on mount

    const getShelfLife = () => {
        if (!item.shelfLifeByStorage || !item.storageLocation) return 7; // default
        return item.shelfLifeByStorage[item.storageLocation as keyof typeof item.shelfLifeByStorage] || 7;
    }
    
    const calculatedExpiryDate = addDays(new Date(), getShelfLife());

    const onStorageChange = (value: string) => {
        handleItemChange(index, 'storageLocation', value);
        // The expiry date will be recalculated automatically by the effect.
    }

    const onDateChange = (date?: Date) => {
        const today = startOfToday();
        const newDate = date || today;
        const shelfLife = differenceInDays(newDate, today);
        
        // This is a bit of a workaround to keep shelfLifeByStorage in sync
        // In a real app, you might want a more sophisticated way to handle manual date changes
        const currentShelfLife = item.shelfLifeByStorage || { counter: 7, pantry: 14, refrigerator: 21, freezer: 365 };
        const updatedShelfLife = {
            ...currentShelfLife,
            [item.storageLocation || 'counter']: shelfLife
        };
        handleItemChange(index, 'shelfLifeByStorage', updatedShelfLife);
    }

    return (
        <Collapsible key={item.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 grid gap-3">
                  <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="text-lg font-semibold h-11"
                      placeholder="Item Name"
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                          value={item.estimatedAmount}
                          onChange={(e) => handleItemChange(index, 'estimatedAmount', e.target.value)}
                          placeholder="Amount (e.g. 1kg)"
                          className="h-11"
                      />
                      <DatePicker
                          date={calculatedExpiryDate}
                          onDateChange={onDateChange}
                          className="h-11"
                      />
                  </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(index)}>
                  <Trash2 className="h-5 w-5" />
              </Button>
            </div>

            <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full border-dashed data-[state=open]:border-solid">
                    <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-300 data-[state=open]:rotate-180" />
                    <span className="data-[state=open]:hidden">Add details (optional)</span>
                    <span className="data-[state=closed]:hidden">Hide details</span>
                </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
                <div className="space-y-4 rounded-md border-dashed border bg-secondary/50 p-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor={`storage-${item.id}`}>Store in:</Label>
                            <Select value={item.storageLocation} onValueChange={onStorageChange}>
                                <SelectTrigger id={`storage-${item.id}`} className="h-11 bg-background"><SelectValue placeholder="Select location..." /></SelectTrigger>
                                <SelectContent>
                                    {storageLocations.map(loc => <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor={`useby-${item.id}`}>Use by:</Label>
                            <Select value={item.useByTimeline} onValueChange={(value) => handleItemChange(index, 'useByTimeline', value)}>
                                <SelectTrigger id={`useby-${item.id}`} className="h-11 bg-background"><SelectValue placeholder="Select timeline..." /></SelectTrigger>
                                <SelectContent>
                                    {useByTimelines.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor={`source-${item.id}`}>From:</Label>
                            <Select value={item.purchaseSource} onValueChange={(value) => handleItemChange(index, 'purchaseSource', value)}>
                                <SelectTrigger id={`source-${item.id}`} className="h-11 bg-background"><SelectValue placeholder="Select source..." /></SelectTrigger>
                                <SelectContent>
                                    {purchaseSources.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor={`price-${item.id}`}>Estimated Cost (PHP):</Label>
                            <Input
                                id={`price-${item.id}`}
                                type="number"
                                value={item.estimatedCost ?? ''}
                                onChange={(e) => handleItemChange(index, 'estimatedCost', e.target.valueAsNumber || undefined)}
                                placeholder="e.g. 150.00"
                                className="h-11 bg-background"
                            />
                        </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

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
  
  const handleAddItem = () => {
    const newItem: PantryLogItem = {
      id: crypto.randomUUID(),
      name: '',
      estimatedAmount: '',
      estimatedExpirationDate: addDays(new Date(), 7).toISOString(),
      shelfLifeByStorage: { counter: 7, pantry: 14, refrigerator: 21, freezer: 365 },
      storageLocation: 'counter', // Default
      carbonFootprint: 0,
      estimatedCost: 0,
    };
    setItems([newItem, ...items]);
  };

  const handleConfirmAndSave = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        return;
    }
    setIsSaving(true);
    try {
      const itemsToSave = items.map(item => {
        const shelfLife = item.shelfLifeByStorage[item.storageLocation as keyof typeof item.shelfLifeByStorage || 'counter'] || 7;
        const expirationDate = addDays(new Date(), shelfLife);
        return {
            ...item,
            estimatedExpirationDate: expirationDate.toISOString(),
        }
      });
      
      const optimisticPantryItems = itemsToSave.map(logItem => ({
        ...logItem,
        id: logItem.id,
        addedDate: new Date().toISOString(),
        status: 'live' as const,
      }));
      usePantryLogStore.getState().addOptimisticItems(optimisticPantryItems);

      try {
        await Promise.race([
          savePantryItems(user.uid, itemsToSave),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
        ]);
      } catch(err) {
        console.error('Firestore ACK timeout – proceeding optimistically', err);
      }
      
      toast({
        title: 'Success!',
        description: 'Your pantry has been updated.',
        duration: 3000,
      });

      setTimeout(() => {
        safelyResetThenNavigate(reset, router, "/pantry");
      }, 2500);
      
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

  if (items.length === 0 && !isSaving) {
    return (
      <div className="text-center text-muted-foreground py-10">
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
          <div className="flex items-center justify-between">
            <CardTitle>Detected Items</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
             <ItemCard 
                key={item.id}
                item={item} 
                index={index} 
                handleItemChange={handleItemChange} 
                handleRemoveItem={handleRemoveItem} 
            />
          ))}
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
        <Button onClick={handleConfirmAndSave} disabled={isSaving || items.length === 0}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save to Pantry'}
        </Button>
      </div>
    </div>
  );
}
