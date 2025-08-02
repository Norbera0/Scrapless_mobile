
'use client';
import type { PantryItem } from '@/types';
import { differenceInDays, format, startOfToday } from 'date-fns';
import { Button } from '../ui/button';
import { Utensils, Trash2, Edit, Loader2 } from 'lucide-react';
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

interface PantryItemCardProps {
    item: PantryItem;
    onSelect: (item: PantryItem) => void;
    onDelete: (itemId: string) => void;
    isDeleting: boolean;
}

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);

    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) return { label: `Expired`, color: 'bg-red-500', textColor: 'text-white' };
    if (daysLeft === 1) return { label: `1 day left`, color: 'bg-amber-500', textColor: 'text-white' };
    if (daysLeft <= 3) return { label: `${daysLeft} days left`, color: 'bg-amber-500', textColor: 'text-white' };
    return { label: 'Fresh', color: 'bg-green-500', textColor: 'text-white' };
};

export function PantryItemCard({ item, onSelect, onDelete, isDeleting }: PantryItemCardProps) {
    const freshness = getFreshness(item.estimatedExpirationDate);

    return (
        <div className="pantry-item bg-card rounded-2xl p-4 cursor-pointer shadow-md" onClick={() => onSelect(item)}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground text-base pr-2">{item.name}</h3>
                        <span className={`${freshness.color} ${freshness.textColor} px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap`}>
                            {freshness.label.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-center flex-wrap space-x-3 text-sm text-muted-foreground">
                             <span className="flex items-center whitespace-nowrap">
                                <strong>Qty:</strong> {item.estimatedAmount}
                            </span>
                           {item.storageLocation && (
                             <span className="flex items-center whitespace-nowrap capitalize">
                                <strong>In:</strong> {item.storageLocation}
                            </span>
                           )}
                           {item.estimatedCost && (
                             <span className="flex items-center text-green-600 font-medium whitespace-nowrap">
                                <strong>Value:</strong> ₱{item.estimatedCost.toFixed(2)}
                            </span>
                           )}
                        </div>
                        <div className="flex space-x-1 mt-2 md:mt-0">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* TODO: Implement edit */}} className="h-8 w-8 text-muted-foreground hover:bg-secondary">
                                <Edit className="w-4 h-4" />
                            </Button>
                             <AlertDialog onOpenChange={(open) => !open && isDeleting && onDelete('')}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} disabled={isDeleting} className="h-8 w-8 text-destructive hover:bg-red-50">
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
                                    <AlertDialogAction onClick={() => onDelete(item.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
