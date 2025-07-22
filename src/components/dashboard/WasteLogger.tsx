'use client';

import { logFoodWaste, type LogFoodWasteOutput } from '@/ai/flows/log-food-waste';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getImpact, saveWasteLog } from '@/lib/data';
import type { FoodItem, User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Plus, Save, Trash2, Wind, Utensils, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const wasteLogSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Item name is required.'),
      estimatedAmount: z.string().min(1, 'Amount is required.'),
    })
  ),
});

type WasteLogFormValues = z.infer<typeof wasteLogSchema>;

export function WasteLogger() {
  const [user, setUser] = useState<User | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<WasteLogFormValues>({
    resolver: zodResolver(wasteLogSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('scrapless-user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setPhotoDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!photoDataUri) {
      toast({ variant: 'destructive', title: 'No photo selected', description: 'Please select a photo to analyze.' });
      return;
    }
    setIsLoading(true);
    form.reset({ items: [] });
    try {
      const result: LogFoodWasteOutput = await logFoodWaste({ photoDataUri });
      if (result.items && result.items.length > 0) {
        const newItems = result.items.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
        }));
        form.setValue('items', newItems);
        toast({ title: 'Analysis complete!', description: 'Review the items below and adjust as needed.' });
      } else {
        toast({ title: 'No items detected', description: 'Could not identify items in the photo. Please add them manually.' });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Analysis failed', description: 'An error occurred during analysis.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const watchedItems = form.watch('items');

  const impactData = useMemo(() => {
    return watchedItems.reduce(
      (acc, item) => {
        const { peso, co2e } = getImpact(item.name);
        acc.totalPesoValue += peso;
        acc.totalCarbonFootprint += co2e;
        return acc;
      },
      { totalPesoValue: 0, totalCarbonFootprint: 0 }
    );
  }, [watchedItems]);

  const onSave = (data: WasteLogFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found. Please log in again.' });
      return;
    }
    const finalItems: FoodItem[] = data.items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            ...item,
            pesoValue: peso,
            carbonFootprint: co2e,
        }
    })

    saveWasteLog({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userEmail: user.email,
      items: finalItems,
      totalPesoValue: impactData.totalPesoValue,
      totalCarbonFootprint: impactData.totalCarbonFootprint,
      photoDataUri: photoDataUri ?? undefined,
    });

    toast({ title: 'Log saved!', description: 'Your food waste has been successfully logged.' });
    router.push('/trends');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Take a Photo</CardTitle>
              <CardDescription>Upload a picture of your food waste.</CardDescription>
            </CardHeader>
            <CardContent>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div
                className="w-full aspect-video border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                aria-label="Upload a photo"
              >
                {photoPreview ? (
                  <Image src={photoPreview} alt="Food waste preview" width={400} height={225} className="object-cover w-full h-full rounded-md" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto h-12 w-12" />
                    <p>Click or tap to upload a photo</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" onClick={handleAnalyzeClick} disabled={!photoPreview || isLoading} className="w-full">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Utensils className="mr-2 h-4 w-4" />}
                Analyze Waste
              </Button>
            </CardFooter>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>3. Impact Summary</CardTitle>
                <CardDescription>Estimated environmental and financial cost.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Peso Value</p>
                    <p className="text-2xl font-bold">₱{impactData.totalPesoValue.toFixed(2)}</p>
                </div>
                <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                    <p className="text-2xl font-bold">{impactData.totalCarbonFootprint.toFixed(2)}<span className="text-sm">kg CO₂e</span></p>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card className="flex flex-col h-full">
                <CardHeader>
                    <CardTitle>2. Adjust Items</CardTitle>
                    <CardDescription>Edit, add, or remove items detected by the AI.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end">
                            <FormField control={form.control} name={`items.${index}.estimatedAmount`} render={({ field }) => (
                                <FormItem className="w-1/3">
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
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && !isLoading && (
                        <p className="text-muted-foreground text-sm text-center py-8">
                            {photoPreview ? "Click 'Analyze Waste' to get started." : "Upload a photo first."}
                        </p>
                    )}
                     {isLoading && (
                        <div className="flex justify-center items-center py-8">
                             <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-4 !pt-4">
                     <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: crypto.randomUUID(), name: '', estimatedAmount: '' })}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item Manually
                    </Button>
                    <Button type="submit" className="w-full" disabled={isLoading || watchedItems.length === 0}>
                        <Save className="mr-2 h-4 w-4" /> Save Log
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </form>
    </Form>
  );
}
