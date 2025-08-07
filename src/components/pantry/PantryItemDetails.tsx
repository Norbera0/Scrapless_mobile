
'use client';
import { Button } from '../ui/button';
import { PantryItem, ItemInsights } from '@/types';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { X, Bot, Utensils, Trash2, Edit, Loader2, Info, CookingPot, Check, MinusCircle, Package, DivideCircle, PackageCheck } from 'lucide-react';
import Image from 'next/image';
import { updatePantryItemStatus, savePantryItems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { calculateAndSaveAvoidedExpiry } from '@/lib/savings';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { usePantryLogStore } from '@/stores/pantry-store';
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

interface PantryItemDetailsProps {
    item: PantryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (itemId: string) => void;
    onGetInsights: (item: PantryItem) => void;
    isFetchingInsights: boolean;
    insights: ItemInsights | null;
}

function CostPromptDialog({ open, onOpenChange, onSave, isUpdating }: { open: boolean, onOpenChange: (open: boolean) => void, onSave: (cost: number) => void, isUpdating: boolean }) {
    const [cost, setCost] = useState<number | undefined>();

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enter Item Cost</DialogTitle>
                    <DialogDescription>
                        To calculate your savings, please provide an estimated cost for this item.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cost" className="text-right">
                            Cost (₱)
                        </Label>
                        <Input
                            id="cost"
                            type="number"
                            value={cost ?? ''}
                            onChange={(e) => setCost(e.target.valueAsNumber)}
                            className="col-span-3"
                            placeholder="e.g. 150.00"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => cost && onSave(cost)} disabled={!cost || isUpdating}>
                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save and Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export function PantryItemDetails({ item, isOpen, onClose, onDelete, onGetInsights, isFetchingInsights, insights }: PantryItemDetailsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [showCostPrompt, setShowCostPrompt] = useState(false);
    const archiveItem = usePantryLogStore((state) => state.archiveItem);

    if (!isOpen || !item) return null;

    const addedDate = parseISO(item.addedDate);
    const addedAgo = formatDistanceToNowStrict(addedDate, { addSuffix: true });
    
    const executeMarkAsUsed = async (itemWithCost: PantryItem) => {
        if (!user) return;
        setIsUpdating(true);
        try {
            calculateAndSaveAvoidedExpiry(user, itemWithCost, 1.0).catch(console.error);
            archiveItem(itemWithCost.id, 'used');
            updatePantryItemStatus(user.uid, itemWithCost.id, 'used').catch(console.error);
            
            toast({ title: "Item usage logged!", description: `You've used "${itemWithCost.name}".`});
            onClose();
        } catch (error) {
            console.error(`Failed to mark item as used`, error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the item status.' });
        } finally {
            setIsUpdating(false);
            setShowCostPrompt(false);
        }
    }

    const handleMarkAsUsed = async () => {
        if (!item.estimatedCost || item.estimatedCost === 0) {
            setShowCostPrompt(true);
        } else {
            await executeMarkAsUsed(item);
        }
    };
    
    const handleSaveCostAndContinue = async (cost: number) => {
        if (!user || !item) return;
        const updatedItem = { ...item, estimatedCost: cost };
        
        savePantryItems(user.uid, [{
            ...updatedItem,
            estimatedExpirationDate: updatedItem.estimatedExpirationDate,
        }]).catch(err => console.error("Failed to persist updated cost", err));

        await executeMarkAsUsed(updatedItem);
    }
    
    const handleWasteConfirm = async () => {
        if (!user || !item) return;
        setIsUpdating(true);
        try {
            archiveItem(item.id, 'wasted');
            updatePantryItemStatus(user.uid, item.id, 'wasted').catch(console.error);
            
            toast({ title: `Item marked as wasted`, description: `"${item.name}" has been moved to your waste log.`});
            onClose();
        } catch (error) {
            console.error(`Failed to mark item as wasted`, error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the item status.' });
        } finally {
            setIsUpdating(false);
        }
    }


    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                 <DialogHeader>
                    <DialogTitle className="text-2xl">{item.name}</DialogTitle>
                     <DialogDescription>
                        Added {addedAgo}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-secondary/50 p-3">
                            <label className="text-xs text-muted-foreground">Quantity</label>
                            <p className="font-semibold">{item.estimatedAmount}</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                            <label className="text-xs text-muted-foreground">Expires</label>
                            <p className="font-semibold">{format(new Date(item.estimatedExpirationDate), 'MMM d, yyyy')}</p>
                        </div>
                       {item.storageLocation && (
                         <div className="rounded-lg bg-secondary/50 p-3">
                            <label className="text-xs text-muted-foreground">Location</label>
                            <p className="font-semibold capitalize">{item.storageLocation}</p>
                        </div>
                       )}
                       {item.estimatedCost && (
                         <div className="rounded-lg bg-secondary/50 p-3">
                            <label className="text-xs text-muted-foreground">Value</label>
                            <p className="font-semibold text-green-600">₱{item.estimatedCost.toFixed(2)}</p>
                        </div>
                       )}
                    </div>
                </div>
                
                <div className="space-y-4">
                    {!insights && (
                        <Button onClick={() => onGetInsights(item)} className="w-full" disabled={isFetchingInsights}>
                            {isFetchingInsights ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bot className="w-5 h-5 mr-2" />}
                            {isFetchingInsights ? 'Getting Insights...' : 'Get AI-Powered Insights'}
                        </Button>
                    )}
                
                    {insights && (
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Info size={16}/>Storage Tip</h4>
                                <p className="text-sm">{insights.storageTip}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 flex items-center gap-2 text-sm text-muted-foreground"><Info size={16}/>Waste Prevention</h4>
                                <p className="text-sm">{insights.wastePreventionTip}</p>
                            </div>
                            {insights.recipes && insights.recipes.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm text-muted-foreground"><CookingPot size={16}/>Recipe Ideas</h4>
                                    <div className="space-y-2">
                                        {insights.recipes.map(recipe => (
                                            <div key={recipe.id} className="flex items-center justify-between bg-secondary/50 rounded-md p-2">
                                                <div className='flex items-center gap-2'>
                                                    {recipe.photoDataUri && <Image src={recipe.photoDataUri} alt={recipe.name} width={32} height={32} className='rounded-sm object-cover'/>}
                                                    <span className="font-medium text-sm">{recipe.name}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{recipe.cookingTime}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="grid grid-cols-2 gap-2 pt-4">
                     <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleMarkAsUsed}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Used
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button
                                className="bg-amber-500 hover:bg-amber-600"
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MinusCircle className="w-4 h-4" />}
                                Wasted
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>Mark as Wasted?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will move the item out of your active pantry. You can see it later in your waste history.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleWasteConfirm}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="col-span-2">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Item Permanently
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                             <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete "{item.name}" from your pantry and all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                </DialogFooter>
            </DialogContent>
        </Dialog>
        <CostPromptDialog 
            open={showCostPrompt} 
            onOpenChange={setShowCostPrompt} 
            onSave={handleSaveCostAndContinue}
            isUpdating={isUpdating}
        />
        </>
    );
}

