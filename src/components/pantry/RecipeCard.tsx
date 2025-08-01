
'use client';

import Image from 'next/image';
import { type Recipe } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Bookmark, ImageOff, Users, Leaf, Zap, Globe, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: (recipe: Recipe) => void;
}

const getEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('salad')) return '🥗';
    if (lower.includes('soup')) return '🥣';
    if (lower.includes('chicken')) return '🍗';
    if (lower.includes('beef')) return '🥩';
    if (lower.includes('pork')) return '🥓';
    if (lower.includes('fish')) return '🐟';
    if (lower.includes('pasta')) return '🍝';
    if (lower.includes('rice')) return '🍚';
    return '🧑‍🍳';
}

export function RecipeCard({ recipe, isSaved, onToggleSave }: RecipeCardProps) {
    const isUrgent = recipe.tags?.includes('Urgent');

    return (
        <Card className={cn("overflow-hidden h-full flex flex-col", isUrgent ? "bg-amber-50 border-amber-200" : "bg-green-50" )}>
            <CardHeader className="p-4">
                 <div className="flex justify-between items-start gap-2">
                     <div className="space-y-1">
                        {recipe.tags?.map(tag => (
                            <Badge key={tag} variant={tag === 'Urgent' ? 'destructive' : 'default'} className="mr-1">
                                {tag === 'Urgent' ? <Zap className="h-3 w-3 mr-1" /> : <Leaf className="h-3 w-3 mr-1" />}
                                {tag}
                            </Badge>
                        ))}
                        <h3 className="font-bold text-lg leading-tight">{recipe.name}</h3>
                    </div>
                    <div className="text-4xl">{getEmoji(recipe.name)}</div>
                 </div>
            </CardHeader>
            <CardContent className="p-4 flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {recipe.cookingTime}</div>
                    <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {recipe.servings} Servings</div>
                </div>

                <div className={cn("rounded-lg p-3 text-sm", isUrgent ? "bg-amber-100" : "bg-green-100")}>
                    <p className={cn("font-semibold mb-1", isUrgent ? "text-amber-800" : "text-green-800")}>
                        {isUrgent ? 'Uses Your Expiring Items:' : 'Uses Your Fresh Items:'}
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {recipe.ingredients.filter(i => i.status === 'Have').slice(0, 3).map((ing, i) => (
                            <Badge key={i} variant="secondary" className="font-normal">{ing.name}</Badge>
                        ))}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-4 bg-background/50">
                 <div className="flex flex-col w-full">
                    <div className="flex items-center text-xs text-primary font-semibold mb-2">
                       <Globe className="h-3 w-3 mr-1.5" />
                       <p>{recipe.benefit}</p>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" className="w-full">View Recipe</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                                {recipe.photoDataUri && (
                                    <div className="aspect-video w-full relative rounded-md overflow-hidden mb-4" data-ai-hint="recipe food">
                                        <Image src={recipe.photoDataUri} alt={`A generated image of ${recipe.name}`} fill className="object-cover" />
                                    </div>
                                )}
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
                 </div>
            </CardFooter>
        </Card>
    );
}
