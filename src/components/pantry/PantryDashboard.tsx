
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { deletePantryItem } from '@/lib/data';
import type { PantryItem, User } from '@/types';
import { format, differenceInDays, startOfToday } from 'date-fns';
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
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { Badge } from '../ui/badge';
import { usePantryLogStore } from '@/stores/pantry-store';

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return { label: 'Expired', color: 'destructive', days: daysLeft };
    if (daysLeft <= 3) return { label: 'Expiring', color: 'destructive', days: daysLeft };
    if (daysLeft <= 7) return { label: 'Use Soon', color: 'secondary', days: daysLeft };
    return { label: 'Fresh', color: 'default', days: daysLeft };
};


export function PantryDashboard({ initialItems }: { initialItems: PantryItem[]}) {
  const [items, setItems] = useState<PantryItem[]>(initialItems);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  
  const { optimisticItems, clearOptimisticPantryItems } = usePantryLogStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    setIsHydrated(true);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Defer merging optimistic items until after initial client-side hydration
    if (isHydrated && optimisticItems.length > 0) {
      setItems(prevItems => {
        const optimisticIds = new Set(optimisticItems.map(item => item.id));
        const filteredPrevItems = prevItems.filter(item => !optimisticIds.has(item.id));
        const combined = [...optimisticItems, ...filteredPrevItems];
        return combined.sort((a, b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
      });
      clearOptimisticPantryItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, optimisticItems]);


  const handleDelete = async (itemId: string) => {
    setIsDeleting(itemId);
    try {
        await deletePantryItem(itemId);
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        toast({ title: 'Success', description: 'Item deleted from pantry.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
        setIsDeleting(null);
    }
  }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader className='flex-row items-center justify-between'>
                <div className='space-y-1'>
                    <CardTitle>Pantry Items ({items.length})</CardTitle>
                    <CardDescription>All your current food items at a glance.</CardDescription>
                </div>
                <Button onClick={() => router.push('/add-to-pantry')}>
                    <Plus className="mr-2 h-4 w-4" /> Add Items
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                {items.length > 0 ? (
                    items.map(item => {
                        const freshness = getFreshness(item.estimatedExpirationDate);
                        return (
                            <Card key={item.id} className="flex items-center justify-between p-4">
                                <div>
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Amount: {item.estimatedAmount}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Expires: {format(new Date(item.estimatedExpirationDate), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <Badge variant={freshness.color as any}>{freshness.label}</Badge>
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={isDeleting === item.id}>
                                                {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete this item.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </Card>
                        )
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                    <p>Your pantry is empty.</p>
                    <p>Click "Add Items" to get started.</p>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
