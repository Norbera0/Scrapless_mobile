
'use client';

import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import type { User, PantryItem } from '@/types';
import { savePantryItems } from '@/lib/data';
import { format } from 'date-fns';
import { FOOD_DATA_MAP } from '@/lib/food-data';

const reviewSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Item name is required.'),
      estimatedAmount: z.string().min(1, 'Amount is required.'),
      estimatedExpirationDate: z.string().min(1, 'Expiration date is required.'),
    })
  ),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewPantryItems() {
  const router = useRouter();
  const { items, photoDataUri, reset, addOptimisticItems } = usePantryLogStore();
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (items.length === 0 && !isReady) {
       router.replace('/add-to-pantry');
    } else {
      form.reset({ items });
      setIsReady(true);
    }
  }, [items, router, form, isReady]);
  
  const getImpact = (itemName: string): { peso: number; co2e: number, shelfLifeDays: number } => {
    const lowerCaseItem = itemName.toLowerCase();
    for (const key in FOOD_DATA_MAP) {
      if (lowerCaseItem.includes(key)) {
        return FOOD_DATA_MAP[key];
      }
    }
    return { peso: 5, co2e: 0.1, shelfLifeDays: 7 }; // Default for unrecognized items
  }

  const onSubmit = async (data: ReviewFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
        return;
    }
    setIsSaving(true);

    const itemsToSave: Omit<PantryItem, 'id'>[] = data.items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            name: item.name,
            estimatedAmount: item.estimatedAmount,
            estimatedExpirationDate: item.estimatedExpirationDate,
            pesoValue: peso,
            carbonFootprint: co2e,
            addedDate: new Date().toISOString(),
        }
    });

    // For optimistic UI
    const tempItemsForCache: PantryItem[] = data.items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            id: item.id, // use temporary client-generated ID
            name: item.name,
            estimatedAmount: item.estimatedAmount,
            estimatedExpirationDate: item.estimatedExpirationDate,
            pesoValue: peso,
            carbonFootprint: co2e,
            addedDate: new Date().toISOString(),
        }
    })
    
    addOptimisticItems(tempItemsForCache);
    reset(); 
    router.push('/pantry');
    
    try {
        await savePantryItems(user.uid, itemsToSave);
        toast({ title: 'Pantry updated!', description: 'Your new items have been saved.' });
    } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Sync failed', description: 'Could not save your items to the cloud.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  if (!isReady) {
    return (
        <div className="grid md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="w-full aspect-video rounded-lg" />
                </CardContent>
             </Card>
               <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="w-1/3 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
                        <div className="flex-grow space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-10 w-full" /></div>
                        <Skeleton className="h-10 w-10" />
                    </div>
                </CardContent>
             </Card>
        </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
        {photoDataUri && (
             <Card>
                <CardHeader>
                    <CardTitle>Captured Photo</CardTitle>
                    <CardDescription>This is the photo you submitted for analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Image src={photoDataUri} alt="Pantry items photo" width={500} height={400} className="rounded-lg object-cover w-full aspect-video" />
                </CardContent>
             </Card>
        )}
       
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Review & Adjust Items</CardTitle>
                        <CardDescription>Edit, add, or remove items before saving.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-end">
                                 <FormField control={form.control} name={`items.${index}.estimatedAmount`} render={({ field }) => (
                                    <FormItem className="w-1/4">
                                        <FormLabel className="text-xs">Amount</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`items.${index}.name`} render={({ field }) => (
                                    <FormItem className="flex-grow">
                                        <FormLabel className="text-xs">Item</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name={`items.${index}.estimatedExpirationDate`} render={({ field }) => (
                                    <FormItem className="w-1/4">
                                        <FormLabel className="text-xs">Expires</FormLabel>
                                        <FormControl><Input type='date' {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                         <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: crypto.randomUUID(), name: '', estimatedAmount: '', estimatedExpirationDate: format(new Date(), 'yyyy-MM-dd') })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item Manually
                        </Button>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={fields.length === 0 || isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Save to Pantry'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
