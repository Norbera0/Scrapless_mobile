
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Recipe } from '@/types';
import { useRecipeStore } from '@/stores/recipe-store';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { scheduleRecipe } from '@/app/actions';

interface RecipeSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

export function RecipeScheduler({ isOpen, onClose, recipe }: RecipeSchedulerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateRecipe } = useRecipeStore();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mealType, setMealType] = useState<Recipe['mealType']>('Dinner');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !selectedDate || !mealType) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please select a date and meal type.'
        });
        return;
    }
    
    setIsSaving(true);
    try {
        const scheduledDateISO = selectedDate.toISOString();
        console.log('[RecipeScheduler] Calling server action with:', { recipeId: recipe.id, scheduledDate: scheduledDateISO, mealType });
        
        // Optimistically update the UI in Zustand
        updateRecipe(recipe.id, {
            isScheduled: true,
            scheduledDate: scheduledDateISO,
            mealType: mealType,
        });

        // Asynchronously update the backend via server action
        await scheduleRecipe(user.uid, recipe, scheduledDateISO, mealType);
        
        toast({
            title: 'Meal Scheduled!',
            description: `${recipe.name} has been added to your plan.`
        });
        onClose();
    } catch (error) {
        console.error('[RecipeScheduler] Scheduling failed:', error);
        // Revert optimistic update on failure
        updateRecipe(recipe.id, {
            isScheduled: recipe.isScheduled,
            scheduledDate: recipe.scheduledDate,
            mealType: recipe.mealType,
        });
        toast({
            variant: 'destructive',
            title: 'Scheduling Failed',
            description: 'Could not save the meal plan. Please try again.'
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add "{recipe.name}" to Meal Plan</DialogTitle>
          <DialogDescription>
            Choose a date and time to cook this meal.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div>
                <h4 className="font-semibold mb-2 text-center">Select a Date</h4>
                <div className="flex justify-center">
                     <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                    />
                </div>
            </div>
            <div>
                 <h4 className="font-semibold mb-2 text-center">Select a Meal Time</h4>
                 <ToggleGroup 
                    type="single" 
                    value={mealType}
                    onValueChange={(value) => {
                        if (value) setMealType(value as Recipe['mealType']);
                    }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                >
                    <ToggleGroupItem value="Breakfast" className="h-12">Breakfast</ToggleGroupItem>
                    <ToggleGroupItem value="Lunch" className="h-12">Lunch</ToggleGroupItem>
                    <ToggleGroupItem value="Dinner" className="h-12">Dinner</ToggleGroupItem>
                    <ToggleGroupItem value="Snack" className="h-12">Snack</ToggleGroupItem>
                 </ToggleGroup>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedDate || !mealType}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add to Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
