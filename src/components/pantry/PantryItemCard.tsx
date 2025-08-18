
'use client';
import type { PantryItem } from '@/types';
import { differenceInDays, startOfToday } from 'date-fns';
import { Button } from '../ui/button';
import { Utensils, Trash2, Edit, Loader2, Clock, Package } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useAuth } from '@/hooks/use-auth';
import { updatePantryItemStatus } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface PantryItemCardProps {
    item: PantryItem;
    onSelect: (item: PantryItem) => void;
    onDelete: (itemId: string) => void;
    isDeleting: boolean;
}

const emojiMap: { [key: string]: string } = {
    'pork': '🐷', 'chicken': '🐔', 'beef': '🐄', 'fish': '🐟', 'salmon': '🐟', 'tuna': '🐟', 'cabbage': '🥬',
    'garlic': '🧄', 'tomato': '🍅', 'onion': '🧅', 'carrot': '🥕', 'potato': '🥔', 'milk': '🥛',
    'cheese': '🧀', 'butter': '🧈', 'apple': '🍎', 'banana': '🍌', 'orange': '🍊', 'rice': '🍚',
    'bread': '🍞', 'pasta': '🍝', 'lettuce': '🥬', 'egg': '🥚', 'default': '🍽️'
};

const getItemEmoji = (itemName: string) => {
    const lowerItem = itemName.toLowerCase();
    for (const key in emojiMap) {
        if (key !== 'default' && lowerItem.includes(key)) return emojiMap[key];
    }
    return emojiMap.default;
};

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);
    
    if (daysLeft < 0) return { label: 'EXPIRED', color: 'red', days: daysLeft };
    if (daysLeft <= 1) return { label: 'URGENT', color: 'red', days: daysLeft };
    if (daysLeft <= 5) return { label: 'USE SOON', color: 'amber', days: daysLeft };
    return { label: 'FRESH', color: 'green', days: daysLeft };
};

export function PantryItemCard({ item, onSelect, onDelete, isDeleting }: PantryItemCardProps) {
    const freshness = getFreshness(item.estimatedExpirationDate);
    const archiveItem = usePantryLogStore((state) => state.archiveItem);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleUseNow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if(!user) return;
        archiveItem(item.id, 'used');
        await updatePantryItemStatus(user.uid, item.id, 'used').catch(err => {
            console.error("Failed to mark item as used on server", err);
        });
        toast({ title: "Item used!", description: `You've used "${item.name}".`});
    }

    const borderColorClass = {
        red: 'border-l-red-500',
        amber: 'border-l-amber-500',
        green: 'border-l-green-500'
    }[freshness.color];
    
    const badgeColorClass = {
        red: 'bg-red-100 text-red-700',
        amber: 'bg-amber-100 text-amber-700',
        green: 'bg-green-100 text-green-700'
    }[freshness.color];


    return (
        <div 
            className={cn("pantry-item bg-white rounded-lg p-4 cursor-pointer shadow-sm border border-l-4 transition-all hover:shadow-md hover:-translate-y-1", borderColorClass)} 
            onClick={() => onSelect(item)}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{getItemEmoji(item.name)}</span>
                    <h3 className="font-bold text-gray-800 text-base pr-2 leading-tight">{item.name}</h3>
                </div>
                <div className={cn("px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap", badgeColorClass)}>
                    {freshness.label}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{item.quantity} {item.unit}</span>
                </div>
                {item.estimatedCost && (
                    <>
                        <span className="text-gray-300 hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                            <span>₱{item.estimatedCost.toFixed(2)}</span>
                        </div>
                    </>
                )}
            </div>

            <div className="flex items-center justify-between">
                {freshness.color === 'red' ? (
                     <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" onClick={handleUseNow}>
                        Use Now
                    </Button>
                ) : (
                    <div className='flex items-center gap-1 text-sm text-gray-500'>
                        <Clock className="w-4 h-4" />
                        <span>{freshness.days} days left</span>
                    </div>
                )}
                <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelect(item);}} className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                    </Button>
                     <AlertDialog onOpenChange={(open) => !open && isDeleting && onDelete('')}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} disabled={isDeleting} className="h-8 w-8 text-red-400 hover:bg-red-50 hover:text-red-600">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete "{item.name}" from your pantry.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}
