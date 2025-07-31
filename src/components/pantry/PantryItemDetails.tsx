
'use client';
import { Button } from '../ui/button';
import { PantryItem, Recipe } from '@/types';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { X, Bot, Utensils, Trash2, Edit, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface PantryItemDetailsProps {
    item: PantryItem | null;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (itemId: string) => void;
    onGetRecipes: (item: PantryItem) => void;
    isFetchingRecipes: boolean;
    recipes: Recipe[];
}

export function PantryItemDetails({ item, isOpen, onClose, onDelete, onGetRecipes, isFetchingRecipes, recipes }: PantryItemDetailsProps) {
    if (!isOpen || !item) return null;

    const addedDate = new Date(item.addedDate);
    const addedAgo = formatDistanceToNowStrict(addedDate, { addSuffix: true });

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
                        <Button onClick={() => onGetRecipes(item)} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center" disabled={isFetchingRecipes}>
                            {isFetchingRecipes ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : <Bot className="w-6 h-6 mr-3" />}
                            {isFetchingRecipes ? 'Finding Recipes...' : 'Get Recipe Ideas'}
                        </Button>
                    </div>
                    
                     {recipes.length > 0 && (
                         <div className="recipe-card rounded-2xl p-5 mb-6">
                            <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                                <Utensils className="text-lg mr-2" /> Quick Recipe Ideas
                            </h4>
                            <div className="space-y-2">
                                {recipes.slice(0,3).map(recipe => (
                                    <div key={recipe.id} className="flex items-center justify-between bg-white bg-opacity-50 rounded-lg p-3">
                                        <div className='flex items-center gap-3'>
                                            {recipe.photoDataUri && <Image src={recipe.photoDataUri} alt={recipe.name} width={40} height={40} className='rounded-md object-cover'/>}
                                            <span className="font-medium">{recipe.name}</span>
                                        </div>
                                        <span className="text-sm text-yellow-700">{recipe.cookingTime}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="grid grid-cols-2 gap-3">
                        <Button className="gradient-bg text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                            <Utensils className="w-5 h-5 inline mr-2" />
                            Log as Waste
                        </Button>
                        <Button className="bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                            <Edit className="w-5 h-5 inline mr-2" />
                            Edit Item
                        </Button>
                    </div>
                    
                    <Button onClick={() => onDelete(item.id)} className="w-full mt-3 border-2 border-red-300 text-red-600 hover:bg-red-50 py-3 rounded-xl font-medium transition-colors">
                        <Trash2 className="w-5 h-5 inline mr-2" />
                        Delete Item
                    </Button>
                </div>
            </div>
        </div>
    );
}

