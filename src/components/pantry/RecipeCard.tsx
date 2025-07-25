
'use client';

import { useState } from 'react';
import { type Recipe } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Bookmark } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: (recipe: Recipe) => void;
}

const ingredientEmojiMap = {
  Have: '✅',
  Basic: '🏠',
  Need: '🛒',
};

export function RecipeCard({ recipe, isSaved, onToggleSave }: RecipeCardProps) {

  const totalCost = recipe.ingredients
    .filter(ing => ing.status === 'Need' && ing.estimatedCost)
    .reduce((acc, ing) => acc + ing.estimatedCost!, 0);

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm text-muted-foreground">
            <Badge variant="outline">{recipe.cuisine}</Badge>
            <div className="flex items-center gap-1">
                <ChefHat className="h-4 w-4" /> {recipe.difficulty}
            </div>
            <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {recipe.cookingTime}
            </div>
            {totalCost > 0 && <span>Est. Cost: ₱{totalCost.toFixed(2)}</span>}
        </div>

        <div>
            <h4 className="font-semibold mb-1">Ingredients</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {recipe.ingredients.map((ing, i) => (
                    <span key={i}>
                        {ingredientEmojiMap[ing.status]} {ing.name}
                        {ing.status === 'Need' && ing.estimatedCost && ` (₱${ing.estimatedCost})`}
                    </span>
                ))}
            </div>
        </div>

        <div className="flex gap-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="flex-1">View Recipe</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                    <DialogTitle>{recipe.name}</DialogTitle>
                    <DialogDescription>
                        {recipe.cuisine} • {recipe.difficulty} • {recipe.cookingTime}
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                            <ul className="list-disc list-inside space-y-1">
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.name}</li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                            <ol className="list-decimal list-inside space-y-2">
                               {recipe.instructions.map((step, i) => (
                                   <li key={i}>{step}</li>
                               ))}
                            </ol>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Button variant={isSaved ? 'default' : 'outline'} className="flex-1" onClick={() => onToggleSave(recipe)}>
                <Bookmark className="mr-2 h-4 w-4" /> {isSaved ? 'Saved' : 'Save'}
            </Button>
        </div>
    </div>
  );
}
