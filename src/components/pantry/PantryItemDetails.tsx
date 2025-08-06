
'use client';
import { Button } from '../ui/button';
import { PantryItem, ItemInsights } from '@/types';
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';
import { X, Bot, Utensils, Trash2, Edit, Loader2, Info, CookingPot, Check, MinusCircle, Package, DivideCircle, PackageCheck } from 'lucide-react';
import Image from 'next/image';
import { updatePantryItemStatus } from '@/lib/data';
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface PantryItemDetailsProps {
    item: PantryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (itemId: string) => void;
    onGetInsights: (item: PantryItem) => void;
    isFetchingInsights: boolean;
    insights: ItemInsights | null;
}

export function PantryItemDetails({ item, isOpen, onClose, onDelete, onGetInsights, isFetchingInsights, insights }: PantryItemDetailsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    if (!isOpen || !item) return null;

    const addedDate = parseISO(item.addedDate);
    const addedAgo = formatDistanceToNowStrict(addedDate, { addSuffix: true });

    const handleMarkAsUsed = async () => {
        if (!user || !item) return;
        setIsUpdating(true);
        try {
            // Assumes 100% usage (usageEfficiency = 1.0)
            calculateAndSaveAvoidedExpiry(user, item, 1.0).catch(console.error);

            // Update item status in DB (fire-and-forget)
            updatePantryItemStatus(user.uid, item.id, 'used').catch(console.error);
            
            toast({ title: "Item usage logged!", description: `You've used "${item.name}".`});
            onClose();
        } catch (error) {
            console.error(`Failed to mark item as used`, error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update the item status.' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleWasteConfirm = async () => {
        if (!user || !item) return;
        setIsUpdating(true);
        try {
            // Update item status to 'wasted' (fire-and-forget)
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
        <div className="fixed inset-0 z-50">
            <div className="modal-overlay absolute inset-0" onClick={onClose}></div>
            <div className={`modal absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto ${isOpen ? 'show' : ''}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                        <Button variant="ghost" size="icon" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X className="w-6 h-6 text-gray-400" />
                        </Button>
                    </div>

                    <div className="glass-card rounded-2xl p-5 mb-6">
                         <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="text-sm text-gray-500 uppercase tracking-wide">Quantity</label>
                                <p className="text-lg font-semibold text-gray-900">{item.estimatedAmount}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 uppercase tracking-wide">Expires</label>
                                <p className="text-lg font-semibold text-gray-900">{format(new Date(item.estimatedExpirationDate), 'MMM d, yyyy')}</p>
                            </div>
                           {item.storageLocation && (
                             <div>
                                <label className="text-sm text-gray-500 uppercase tracking-wide">Location</label>
                                <p className="text-lg font-semibold text-gray-900 capitalize">{item.storageLocation}</p>
                            </div>
                           )}
                           {item.estimatedCost && (
                             <div>
                                <label className="text-sm text-gray-500 uppercase tracking-wide">Value</label>
                                <p className="text-lg font-semibold text-green-600">₱{item.estimatedCost.toFixed(2)}</p>
                            </div>
                           )}
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                           Added {addedAgo}
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        {!insights && (
                            <Button onClick={() => onGetInsights(item)} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center" disabled={isFetchingInsights}>
                                {isFetchingInsights ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Bot className="w-6 h-6 mr-3" />}
                                {isFetchingInsights ? 'Getting Insights...' : 'Get AI-Powered Insights'}
                            </Button>
                        )}
                    </div>
                    
                     {insights && (
                         <div className="space-y-4">
                            <div className="ai-insight-card rounded-2xl p-5">
                                <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                                    <Info className="text-lg mr-2" /> Storage Tip
                                </h4>
                                <p className="text-sm text-purple-800">{insights.storageTip}</p>
                            </div>
                            <div className="tip-card rounded-2xl p-5">
                                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                                    <Info className="text-lg mr-2" /> Waste Prevention
                                </h4>
                                <p className="text-sm text-green-800">{insights.wastePreventionTip}</p>
                            </div>
                            {insights.recipes && insights.recipes.length > 0 && (
                                <div className="recipe-card rounded-2xl p-5">
                                    <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                                        <CookingPot className="text-lg mr-2" /> Recipe Ideas
                                    </h4>
                                    <div className="space-y-2">
                                        {insights.recipes.map(recipe => (
                                            <div key={recipe.id} className="flex items-center justify-between bg-white bg-opacity-50 rounded-lg p-3">
                                                <div className='flex items-center gap-3'>
                                                    {recipe.photoDataUri && <Image src={recipe.photoDataUri} alt={recipe.name} width={40} height={40} className='rounded-md object-cover'/>}
                                                    <span className="font-medium text-sm">{recipe.name}</span>
                                                </div>
                                                <span className="text-xs text-yellow-700">{recipe.cookingTime}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <Button 
                            className="bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                            onClick={handleMarkAsUsed}
                            disabled={isUpdating}
                        >
                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 inline mr-2" />}
                            Mark as Used
                        </Button>
                         <Button
                            className="bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                            onClick={handleWasteConfirm}
                            disabled={isUpdating}
                        >
                             {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <MinusCircle className="w-5 h-5 inline mr-2" />}
                            Mark as Wasted
                        </Button>
                    </div>
                    
                    <Button onClick={() => onDelete(item.id)} className="w-full mt-3 border-2 border-gray-300 text-gray-600 hover:bg-gray-100 py-3 rounded-xl font-medium transition-colors">
                        <Trash2 className="w-5 h-5 inline mr-2" />
                        Delete Item Permanently
                    </Button>
                </div>
            </div>
        </div>
    );
}
