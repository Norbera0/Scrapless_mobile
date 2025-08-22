
'use client';
import { Button } from '../ui/button';
import { PantryItem } from '@/types';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { X, Bot, Utensils, Trash2, Edit, Loader2, Info, CookingPot, Check, MinusCircle, Package, DivideCircle, PackageCheck, Lightbulb, RefreshCw, Star, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { updatePantryItemStatus, savePantryItems } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { calculateAndSaveAvoidedExpiry } from '@/lib/savings';
import { useState, useEffect } from 'react';
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
} from "@/components/ui/alert-dialog";
import { fetchItemInsights } from '@/app/actions';
import { useItemInsightStore } from '@/stores/item-insight-store';
import type { GetItemInsightsOutput } from '@/ai/schemas';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

interface PantryItemDetailsProps {
    item: PantryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (itemId: string) => void;
    onEdit: (item: PantryItem) => void;
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

function AITipsSection({ item }: { item: PantryItem }) {
    const { insights, setInsight, isGenerating, setIsGenerating } = useItemInsightStore();
    const { toast } = useToast();
    
    const itemInsight = insights[item.id];

    const handleGenerate = async () => {
        setIsGenerating(item.id, true);
        try {
            const result = await fetchItemInsights({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                estimatedExpirationDate: item.estimatedExpirationDate,
                estimatedCost: item.estimatedCost,
            });
            setInsight(item.id, result);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to get insights', description: 'The AI assistant is busy. Please try again later.' });
        } finally {
            setIsGenerating(item.id, false);
        }
    }

    if (isGenerating[item.id]) {
        return (
            <div className="flex items-center justify-center text-muted-foreground p-8">
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                <p>Generating tips...</p>
            </div>
        );
    }
    
    if (!itemInsight) {
        return (
             <Button onClick={handleGenerate} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Get AI-Powered Tips
             </Button>
        )
    }

    return (
        <div className="space-y-4">
            <Accordion type="single" collapsible className="w-full" defaultValue="storage">
                <AccordionItem value="storage">
                    <AccordionTrigger>Storage Tip</AccordionTrigger>
                    <AccordionContent>
                        {itemInsight.storageTip}
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="waste">
                    <AccordionTrigger>Waste Prevention</AccordionTrigger>
                    <AccordionContent>
                       {itemInsight.wastePreventionTip}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="recipes">
                    <AccordionTrigger>Recipe Ideas</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                        {itemInsight.recipes.map(recipe => (
                             <div key={recipe.id} className="p-3 bg-secondary/50 rounded-lg">
                                <h4 className="font-semibold">{recipe.name}</h4>
                                <p className="text-xs text-muted-foreground">{recipe.description}</p>
                                <div className="flex items-center gap-4 text-xs mt-1">
                                    <Badge variant="outline">{recipe.difficulty}</Badge>
                                    <span className="text-muted-foreground">{recipe.cookingTime}</span>
                                </div>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
            <Button variant="outline" size="sm" onClick={handleGenerate} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
            </Button>
        </div>
    )
}


export function PantryItemDetails({ item, isOpen, onClose, onDelete, onEdit }: PantryItemDetailsProps) {
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
            id: updatedItem.id,
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
            
            toast({ title: `Item marked as wasted`, description: `"${item.name}" has been moved to your waste history.`});
            onClose();
        } catch (error) {
            console.error(`Failed to mark item as wasted`, error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the item status.' });
        } finally {
            setIsUpdating(false);
        }
    }
    
    const handleEdit = () => {
        onClose();
        onEdit(item);
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
                            <p className="font-semibold">{item.quantity} {item.unit}</p>
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
                
                <AITipsSection item={item} />


                <DialogFooter className="grid grid-cols-2 gap-2 pt-4">
                     <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleMarkAsUsed}
                        disabled={isUpdating}
                    >
                        {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Mark as Used
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button
                                variant="outline"
                                disabled={isUpdating}
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MinusCircle className="w-4 h-4 mr-2" />}
                                Mark as Wasted
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
                    
                    <div className="col-span-2 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleEdit}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
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
                    </div>

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
