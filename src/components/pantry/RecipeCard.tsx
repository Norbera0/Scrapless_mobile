
'use client';

import Image from 'next/image';
import { type Recipe } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Bookmark, ImageOff, Users, Leaf, Zap, Globe, Heart, CookingPot, Utensils, Bot, CalendarPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { calculateAndSaveRecipeSavings } from '@/lib/savings';
import { useAuth } from '@/hooks/use-auth';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { unsaveRecipe as unsaveRecipeFromDB } from '@/lib/data';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: (recipe: Recipe) => void;
  onAddToPlan: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, isSaved, onToggleSave, onAddToPlan }: RecipeCardProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const deductRecipeIngredients = usePantryLogStore((state) => state.deductRecipeIngredients);
    const { setRecipes } = useRecipeStore();
    const currentRecipes = useRecipeStore((state) => state.recipes);

    const handleMarkAsCooked = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;

        const { deductedItems, missingItems } = deductRecipeIngredients(recipe.ingredients);

        calculateAndSaveRecipeSavings(user, recipe).catch(err => {
            console.error("Failed to save recipe savings event:", err);
        });
        
        // Remove the recipe from the database as well
        unsaveRecipeFromDB(user.uid, recipe.id).catch(err => {
             console.error("Failed to unsave cooked recipe from DB:", err);
        });

        let description = `You've earned savings for cooking "${recipe.name}".`;
        if (deductedItems.length > 0) {
            description += ` Your pantry has been updated.`
        }
        if (missingItems.length > 0) {
             description += ` Could not find or deduct: ${missingItems.map(i => i.name).join(', ')}.`;
        }

        toast({
            title: "Nice one!",
            description,
        });

        setRecipes(currentRecipes.filter(r => r.id !== recipe.id));
    };

    return (
        <Dialog>
            <Card className="overflow-hidden h-full flex flex-col group border-green-500/20 hover:border-green-500/50 transition-colors w-full min-w-0">
                <CardHeader className="p-0 relative flex-shrink-0">
                    <DialogTrigger asChild>
                        <div className="aspect-video w-full relative overflow-hidden cursor-pointer" data-ai-hint="recipe food">
                            {recipe.photoDataUri ? (
                                <Image src={recipe.photoDataUri} alt={`A generated image of ${recipe.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full bg-secondary/70 flex items-center justify-center">
                                    <Utensils className="w-16 h-16 text-primary/40" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                             <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs bg-black/50 text-white border-white/20">
                                <Bot className="h-3 w-3 mr-1.5" />
                                AI-Generated
                            </Badge>
                        </div>
                    </DialogTrigger>
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[calc(100%-5rem)]">
                        {recipe.tags?.map(tag => (
                            <Badge key={tag} variant={tag === 'Urgent' ? 'destructive' : 'secondary'} className="shadow-lg text-xs whitespace-nowrap">
                                {tag === 'Urgent' ? <Zap className="h-3 w-3 mr-1" /> : <Leaf className="h-3 w-3 mr-1" />}
                                {tag}
                            </Badge>
                        ))}
                    </div>
                     <Button size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex-shrink-0" onClick={() => onToggleSave(recipe)}>
                        <Heart className={cn("h-4 w-4 text-white transition-colors", isSaved && "fill-red-500 text-red-500")} />
                     </Button>
                </CardHeader>
                <CardContent className="p-3 flex-1 min-h-0">
                    <h3 className="font-bold text-sm leading-tight md:text-base line-clamp-2 mb-1">{recipe.name}</h3>
                     <p className="text-xs font-semibold text-green-600 mt-1 line-clamp-2">{recipe.benefit}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                        <div className="flex items-center gap-1 whitespace-nowrap"><Clock className="h-3 w-3 flex-shrink-0" /> {recipe.cookingTime}</div>
                        <div className="flex items-center gap-1 whitespace-nowrap"><ChefHat className="h-3 w-3 flex-shrink-0" /> {recipe.difficulty}</div>
                    </div>
                </CardContent>
                <CardFooter className="p-2 bg-secondary/30 flex justify-between items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" className="h-auto px-2 py-1 text-xs flex-1 min-w-0" onClick={() => onAddToPlan(recipe)}>
                        <CalendarPlus className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Add to Plan</span>
                    </Button>
                    <DialogTrigger asChild>
                         <Button size="sm" className="h-auto px-2 py-1 text-xs flex-1 min-w-0 bg-primary text-primary-foreground hover:bg-primary/90">
                            <span className="truncate">View Recipe</span>
                        </Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>

            {/* Modal Content */}
            <DialogContent className="max-h-[80vh] overflow-y-auto max-w-2xl">
                <DialogHeader>
                    <div className="aspect-video w-full relative rounded-md overflow-hidden mb-4" data-ai-hint="recipe food">
                        {recipe.photoDataUri ? (
                            <Image src={recipe.photoDataUri} alt={`A generated image of ${recipe.name}`} fill className="object-cover" />
                        ) : (
                             <div className="w-full h-full bg-secondary/70 flex items-center justify-center">
                                <Utensils className="w-20 h-20 text-primary/40" />
                            </div>
                        )}
                         <Badge variant="secondary" className="absolute bottom-2 left-2 text-xs bg-black/50 text-white border-white/20">
                            <Bot className="h-3 w-3 mr-1.5" />
                            AI-Generated Image
                        </Badge>
                    </div>
                    <DialogTitle className="text-left">{recipe.name}</DialogTitle>
                    <DialogDescription className="text-left">
                        {recipe.cuisine} • {recipe.difficulty} • {recipe.cookingTime} • {recipe.servings} Servings
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} className={cn("break-words", ing.status === 'Need' && 'text-muted-foreground')}>
                                    {ing.quantity} {ing.unit} {ing.name}
                                    {ing.status === 'Need' && <Badge variant="outline" className="ml-2">Need</Badge>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Instructions</h3>
                        <ol className="list-decimal list-inside space-y-2">
                        {recipe.instructions.map((step, i) => (
                            <li key={i} className="break-words">{step}</li>
                        ))}
                        </ol>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleMarkAsCooked} className="w-full">
                        <CookingPot className="mr-2 h-4 w-4" />
                        Mark as Cooked
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
