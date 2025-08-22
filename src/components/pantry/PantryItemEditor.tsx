
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PantryItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { savePantryItems } from '@/lib/data';
import { usePantryLogStore } from '@/stores/pantry-store';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { addDays, parseISO } from 'date-fns';

const storageLocations = [
  { value: 'counter', label: 'Counter' },
  { value: 'pantry', label: 'Pantry' },
  { value: 'refrigerator', label: 'Refrigerator' },
  { value: 'freezer', label: 'Freezer' },
];

const pantryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required.'),
  quantity: z.union([z.string(), z.number()]).refine(val => {
    if (typeof val === 'number') return val > 0;
    if (typeof val === 'string') {
        if (!isNaN(parseFloat(val))) return parseFloat(val) > 0;
        const parts = val.split('/');
        return parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]));
    }
    return false;
  }, { message: "Quantity must be a positive number or fraction."}),
  unit: z.string().min(1, 'Unit is required.'),
  estimatedExpirationDate: z.date({ required_error: "Expiration date is required."}),
  storageLocation: z.string().optional(),
  estimatedCost: z.union([z.string(), z.number()]).optional(),
});

type PantryItemFormData = z.infer<typeof pantryItemSchema>;

const parseFraction = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        if (value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 2) {
                const numerator = parseInt(parts[0], 10);
                const denominator = parseInt(parts[1], 10);
                if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
                    return numerator / denominator;
                }
            }
        }
        return parseFloat(value);
    }
    return 0;
};


interface PantryItemEditorProps {
  item: PantryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PantryItemEditor({ item, isOpen, onClose }: PantryItemEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const addLiveItems = usePantryLogStore(state => state.addLiveItems);
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm<PantryItemFormData>({
    resolver: zodResolver(pantryItemSchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimatedExpirationDate: parseISO(item.estimatedExpirationDate),
        storageLocation: item.storageLocation,
        estimatedCost: item.estimatedCost,
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: PantryItemFormData) => {
    if (!user || !item) return;

    setIsSaving(true);
    try {
      const itemToSave: PantryItem = {
        ...item,
        name: data.name,
        quantity: parseFraction(data.quantity),
        unit: data.unit,
        estimatedExpirationDate: data.estimatedExpirationDate.toISOString(),
        storageLocation: data.storageLocation,
        estimatedCost: data.estimatedCost ? parseFraction(data.estimatedCost) : undefined,
      };
      
      await savePantryItems(user.uid, [itemToSave]);

      // The listener in data.ts will update the zustand store automatically.
      
      toast({
        title: 'Item Updated',
        description: `"${data.name}" has been successfully updated.`,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save pantry item:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'An error occurred while saving the item.',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {item.name}</DialogTitle>
          <DialogDescription>
            Make changes to your pantry item here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="text" {...register('quantity')} />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
             <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" {...register('unit')} />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
            </div>
          </div>
          
           <div className="grid gap-2">
                <Label htmlFor="estimatedExpirationDate">Expiration Date</Label>
                <Controller
                    control={control}
                    name="estimatedExpirationDate"
                    render={({ field }) => (
                         <DatePicker
                            date={field.value}
                            onDateChange={field.onChange}
                        />
                    )}
                />
                 {errors.estimatedExpirationDate && <p className="text-xs text-destructive">{errors.estimatedExpirationDate.message}</p>}
           </div>

            <div className="grid gap-2">
              <Label htmlFor="storageLocation">Storage Location</Label>
              <Controller
                  control={control}
                  name="storageLocation"
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="storageLocation">
                            <SelectValue placeholder="Select a location..." />
                        </SelectTrigger>
                        <SelectContent>
                            {storageLocations.map(loc => <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                  )}
              />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="estimatedCost">Estimated Cost (₱)</Label>
                <Input id="estimatedCost" type="text" {...register('estimatedCost')} />
                 {errors.estimatedCost && <p className="text-xs text-destructive">{errors.estimatedCost.message}</p>}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
