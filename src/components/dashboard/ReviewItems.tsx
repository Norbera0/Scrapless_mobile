
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Loader2, Save, UtensilsCrossed, Plus, Info } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const wasteReasons = [
  "spoiled", "expired", "cooked_too_much", "forgot_about_it",
  "didn't_like_taste", "got_moldy", "family_member_didn't_eat",
  "changed_meal_plans", "bought_too_much"
];

export function ReviewItems() {
  const router = useRouter();
  const { toast } = useToast();
  const { items, setItems, photoDataUri, reset } = useWasteLogStore();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const [openCollapsibles, setOpenCollapsibles] = useState<Record<string, boolean>>({});

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
              wasteReason: item.wasteReason,
          }
      });
  
      const logData: Omit<WasteLog, 'id'> = {
        date: new Date().toISOString(),
        userId: user.uid,
        items: finalItems,
        totalPesoValue: totalPesoValue,
        totalCarbonFootprint: totalCarbonFootprint,
      };

      if (photoDataUri) {
        logData.photoDataUri = photoDataUri;
      }
      
      await saveWasteLog(logData);

      toast({
          title: 'Success!',
          description: 'Your waste log has been saved.',
      });
      
      setTimeout(() => {
        reset();
        router.replace('/dashboard');
      }, 20);
      
    } catch (error) {
      console.error('Failed to save waste log items:', error);
      toast({
        title: 'Error',
        description: 'Failed to save items. Please try again.',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };
  
  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => ({ ...prev, [id]: !prev[id] }));
  }

  if (items.length === 0 && !isSaving) {
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
          {items.map((item, index) => (
            <Collapsible
              key={item.id}
              open={openCollapsibles[item.id] || false}
              onOpenChange={() => toggleCollapsible(item.id)}
              className="space-y-2 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
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
                <div className="flex items-center gap-2 ml-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Info className="mr-2 h-4 w-4" />
                        {openCollapsibles[item.id] ? 'Hide Details' : 'Add Details'}
                      </Button>
                    </CollapsibleTrigger>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>

              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Why did it go to waste?</label>
                  <Select
                    value={item.wasteReason}
                    onValueChange={(value) => handleItemChange(index, 'wasteReason', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {wasteReasons.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
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
            {isSaving ? 'Saving...' : 'Save Log'}
        </Button>
      </div>
    </div>
  );
}
