
'use client';

import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { Skeleton } from '@/components/ui/skeleton';

const reviewSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, 'Item name is required.'),
      estimatedAmount: z.string().min(1, 'Amount is required.'),
    })
  ),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export function ReviewItems() {
  const router = useRouter();
  const { items, photoDataUri, setItems } = useWasteLogStore();
  const [isReady, setIsReady] = useState(false);

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
    // If there are no items in the store, the user likely landed here
    // by mistake. Redirect them to the logging page to start over.
    // This effect runs only on the client after hydration.
    if (items.length === 0) {
      router.replace('/log-waste?method=camera');
    } else {
      form.reset({ items });
      setIsReady(true);
    }
  }, [items, router, form]);

  const onSubmit = (data: ReviewFormValues) => {
    setItems(data.items);
    router.push('/summary');
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
                    <Image src={photoDataUri} alt="Food waste photo" width={500} height={400} className="rounded-lg object-cover w-full aspect-video" />
                </CardContent>
             </Card>
        )}
       
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card className="flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Review & Adjust Items</CardTitle>
                        <CardDescription>Edit, add, or remove items detected by the AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
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
                         <Button type="button" variant="outline" className="w-full" onClick={() => append({ id: crypto.randomUUID(), name: '', estimatedAmount: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item Manually
                        </Button>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={fields.length === 0}>
                            Calculate Impact <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
