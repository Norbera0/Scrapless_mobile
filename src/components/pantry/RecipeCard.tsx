
'use client';

import Image from 'next/image';
import { type Recipe } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Bookmark, ImageOff, Users, Leaf, Zap, Globe, Heart, CookingPot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { calculateAndSaveRecipeSavings } from '@/lib/savings';
import { useAuth } from '@/hooks/use-auth';

interface RecipeCardProps {
  recipe: Recipe;
  isSaved: boolean;
  onToggleSave: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, isSaved, onToggleSave }: RecipeCardProps) {
    const isUrgent = recipe.tags?.includes('Urgent');
    const { toast } = useToast();
    const { user } = useAuth();

    const handleMarkAsCooked = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        await calculateAndSaveRecipeSavings(user, recipe);
        toast({
            title: "Nice one!",
            description: `You've earned savings for cooking "${recipe.name}". Your pantry has been updated.`,
        });
    };

    return (
        <Dialog>
            <Card className={cn("overflow-hidden h-full flex flex-col group", isUrgent ? "bg-amber-500/10 border-amber-500/30" : "bg-card" )}>
                <CardHeader className="p-0 relative">
                    <DialogTrigger asChild>
                        <div className="aspect-video w-full relative overflow-hidden cursor-pointer" data-ai-hint="recipe food">
                            {recipe.photoDataUri ? (
                                <Image src={recipe.photoDataUri} alt={`A generated image of ${recipe.name}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <ImageOff className="w-10 h-10 text-muted-foreground" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                        </div>
                    </DialogTrigger>
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                        {recipe.tags?.map(tag => (
                            <Badge key={tag} variant={tag === 'Urgent' ? 'destructive' : 'secondary'} className="shadow-lg text-xs">
                                {tag === 'Urgent' ? <Zap className="h-3 w-3 mr-1" /> : <Leaf className="h-3 w-3 mr-1" />}
                                {tag}
                            </Badge>
                        ))}
                    </div>
                     <Button size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm" onClick={() => onToggleSave(recipe)}>
                        <Bookmark className={cn("h-4 w-4 text-white", isSaved && "fill-white")} />
                     </Button>
                </CardHeader>
                <CardContent className="p-3 flex-1">
                     <DialogTrigger asChild>
                        <h3 className="font-bold text-base leading-tight cursor-pointer hover:underline">{recipe.name}</h3>
                    </DialogTrigger>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.cookingTime}</div>
                        <div className="flex items-center gap-1"><ChefHat className="h-3 w-3" /> {recipe.difficulty}</div>
                    </div>
                </CardContent>
                <CardFooter className="p-2 bg-secondary/30 flex justify-between items-center">
                     <div className="flex items-center text-xs text-primary font-semibold">
                       <Globe className="h-3 w-3 mr-1.5" />
                       <p>{recipe.benefit}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-auto px-2 py-1 text-xs" onClick={handleMarkAsCooked}>
                        <CookingPot className="h-4 w-4 mr-1" /> Cooked
                    </Button>
                </CardFooter>
            </Card>

            {/* Modal Content */}
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    {recipe.photoDataUri && (
                        <div className="aspect-video w-full relative rounded-md overflow-hidden mb-4" data-ai-hint="recipe food">
                            <Image src={recipe.photoDataUri} alt={`A generated image of ${recipe.name}`} fill className="object-cover" />
                        </div>
                    )}
                    <DialogTitle>{recipe.name}</DialogTitle>
                    <DialogDescription>
                        {recipe.cuisine} • {recipe.difficulty} • {recipe.cookingTime} • {recipe.servings} Servings
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Ingredients</h3>
                        <ul className="list-disc list-inside space-y-1">
                            {recipe.ingredients.map((ing, i) => (
                                <li key={i} className={cn(ing.status === 'Need' && 'text-muted-foreground')}>
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
                            <li key={i}>{step}</li>
                        ))}
                        </ol>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
