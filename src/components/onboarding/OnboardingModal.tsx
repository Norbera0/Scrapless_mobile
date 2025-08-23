

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import type { HouseholdSize, MonthlyBudget, DietaryRestriction, CookingFrequency, ShoppingLocation, UserGoal } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2, Sparkles, CookingPot, Package, Banknote, Landmark } from 'lucide-react';
import { Input } from '../ui/input';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const householdSizeOptions: { value: HouseholdSize; label: string }[] = [
    { value: '1', label: 'Just me (1)' },
    { value: '2', label: '2 people' },
    { value: '3-4', label: '3-4 people' },
    { value: '5+', label: '5+ people' }
];
const budgetOptions: { value: MonthlyBudget; label: string }[] = [
    { value: 'under_3k', label: '₱3,000 or less' },
    { value: '3k_6k', 'label': '₱3,000 - ₱6,000' },
    { value: '6k_10k', 'label': '₱6,000 - ₱10,000' },
    { value: 'over_10k', 'label': '₱10,000+' }
];
const dietaryOptions: { value: DietaryRestriction; label: string }[] = [
    { value: 'no_pork', label: 'No pork' },
    { value: 'no_beef', label: 'No beef' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'diabetic_friendly', label: 'Diabetic-friendly' },
    { value: 'allergies', label: 'Food allergies' },
    { value: 'none', label: 'None' },
];
const cookingFrequencyOptions: { value: CookingFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: '4_5_times', label: '4-5 times a week' },
    { value: '2_3_times', label: '2-3 times a week' },
    { value: 'rarely', label: 'Rarely/Weekends only' }
];
const shoppingLocationOptions: { value: ShoppingLocation; label: string }[] = [
    { value: 'wet_market', label: 'Wet market' },
    { value: 'supermarket', label: 'Supermarket' },
    { value: 'online', label: 'Online delivery' },
    { value: 'mixed', label: 'Mix of places' }
];
const goalOptions: { value: UserGoal; label: string }[] = [
    { value: 'save_money', label: 'Save money on groceries' },
    { value: 'reduce_waste', label: 'Reduce food waste by half' },
    { value: 'meal_planning', label: 'Learn better meal planning' },
    { value: 'stop_spoiling', label: 'Stop throwing away spoiled food' },
    { value: 'other', label: 'Other' },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { settings, setSettings } = useUserSettingsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [householdSize, setHouseholdSize] = useState<HouseholdSize>('2');
  const [monthlyBudget, setMonthlyBudget] = useState<MonthlyBudget>('6k_10k');
  const [dietary, setDietary] = useState<DietaryRestriction[]>([]);
  const [foodAllergiesText, setFoodAllergiesText] = useState('');
  const [frequency, setFrequency] = useState<CookingFrequency>('daily');
  const [shopping, setShopping] = useState<ShoppingLocation[]>(['supermarket']);
  const [goal, setGoal] = useState<UserGoal>('save_money');
  const [otherGoalText, setOtherGoalText] = useState('');
  const [notes, setNotes] = useState('');
  const [savingsGoal, setSavingsGoal] = useState(settings.savingsGoal || 5000);

  const handleSaveAndFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const newSettings = {
        ...settings,
        householdSize,
        monthlyBudget,
        dietaryRestrictions: dietary,
        foodAllergies: foodAllergiesText,
        cookingFrequency: frequency,
        shoppingLocations: shopping,
        primaryGoal: goal,
        otherGoal: otherGoalText,
        notes,
        savingsGoal,
      };
      setSettings(newSettings);
      await saveUserSettings(user.uid, newSettings);
      toast({ title: "Preferences Saved!", description: "Your experience is now personalized." });
      onClose();
      router.push('/log-waste?method=camera'); // Redirect after saving
    } catch (error) {
      toast({ variant: 'destructive', title: "Save Failed", description: "Could not save your preferences." });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!api) {
      return;
    }
    setCurrentStep(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrentStep(api.selectedScrollSnap());
    });
  }, [api]);

  const handleDietaryChange = (checked: boolean, value: DietaryRestriction) => {
    if (value === 'none') {
        setDietary(checked ? ['none'] : []);
    } else {
        setDietary(prev => {
            const newDietary = checked ? [...prev, value] : prev.filter(v => v !== value);
            return newDietary.filter(v => v !== 'none'); // Remove 'none' if other options are selected
        });
    }
  };

  const isAllergiesChecked = dietary.includes('allergies');
  const isOtherGoalChecked = goal === 'other';

  const steps = [
    { title: "Household Size", content: 
      <RadioGroup value={householdSize} onValueChange={setHouseholdSize} className="gap-3">
        {householdSizeOptions.map(o => <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={o.value}/><Label htmlFor={o.value}>{o.label}</Label></div>)}
      </RadioGroup> 
    },
    { title: "Grocery Budget", content: 
      <RadioGroup value={monthlyBudget} onValueChange={setMonthlyBudget} className="gap-3">
        {budgetOptions.map(o => <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={o.value}/><Label htmlFor={o.value}>{o.label}</Label></div>)}
      </RadioGroup> 
    },
    { title: "Dietary Needs", content:
      <div className="space-y-3">
        {dietaryOptions.map(option => (
            <div key={option.value}>
                <div className="flex items-center space-x-2">
                    <Checkbox 
                        id={option.value} 
                        checked={dietary.includes(option.value)} 
                        onCheckedChange={(c) => handleDietaryChange(!!c, option.value)} 
                    />
                    <Label htmlFor={option.value}>{option.label}</Label>
                </div>
                 {option.value === 'allergies' && isAllergiesChecked && (
                    <div className="pl-6 pt-2">
                        <Input 
                            placeholder="Please specify allergies..."
                            value={foodAllergiesText}
                            onChange={(e) => setFoodAllergiesText(e.target.value)}
                        />
                    </div>
                )}
            </div>
        ))}
      </div>
    },
    { title: "Cooking & Shopping", content:
      <div className="space-y-6">
        <div>
            <Label className="font-semibold block mb-3">How often do you cook?</Label>
            <RadioGroup value={frequency} onValueChange={setFrequency} className="gap-3">
                {cookingFrequencyOptions.map(o => <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={o.value}/><Label htmlFor={o.value}>{o.label}</Label></div>)}
            </RadioGroup>
        </div>
        <div>
            <Label className="font-semibold block mb-3">Where do you shop?</Label>
            <div className="space-y-3">
                {shoppingLocationOptions.map(o => <div key={o.value} className="flex items-center space-x-2"><Checkbox id={o.value} checked={shopping.includes(o.value)} onCheckedChange={c => setShopping(c ? [...shopping, o.value] : shopping.filter(v => v !== o.value))} /><Label htmlFor={o.value}>{o.label}</Label></div>)}
            </div>
        </div>
      </div>
    },
    { title: "Primary Goal", content: 
      <div className="space-y-3">
          <RadioGroup value={goal} onValueChange={(value) => setGoal(value as UserGoal)} className="gap-3">
            {goalOptions.map(o => <div key={o.value} className="flex items-center space-x-2"><RadioGroupItem value={o.value} id={o.value}/><Label htmlFor={o.value}>{o.label}</Label></div>)}
          </RadioGroup>
          {isOtherGoalChecked && (
             <div className="pl-6 pt-2">
                <Input 
                    placeholder="What's your main goal?"
                    value={otherGoalText}
                    onChange={(e) => setOtherGoalText(e.target.value)}
                />
            </div>
          )}
      </div>
    },
    { title: "Monthly Savings Goal", content: 
        <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">How much would you like to save each month by reducing waste?</p>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-semibold text-lg">₱</span>
                <Input
                    type="number"
                    value={savingsGoal}
                    onChange={(e) => setSavingsGoal(Number(e.target.value))}
                    className="text-lg font-bold h-12"
                    placeholder="5,000"
                />
            </div>
        </div>
    },
    { title: "Other Notes", content: 
        <Textarea placeholder="e.g. Kids are picky eaters, I prefer quick meals..." value={notes} onChange={e => setNotes(e.target.value)} rows={5} />
    },
    {
      title: "Confirmation",
      content: (
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            <h2 className="text-2xl font-bold">You’re all set!</h2>
            <p className="text-gray-600">
                We’ve saved your preferences. Here’s how to get started:
            </p>
            <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-3 text-left w-full max-w-sm text-sm">
                <div className="text-lg">🥘</div>
                <div><b>Log your food waste</b> — snap a photo or use voice</div>
                <div className="text-lg">📦</div>
                <div><b>Add food items to your pantry</b> — track freshness & get recipes</div>
                <div className="text-lg">💰</div>
                <div><b>See how much you’ve saved</b> — money + CO₂ reduced</div>
                <div className="text-lg">🏦</div>
                <div><b>Grow your savings with BPI</b> — less waste, more savings</div>
            </div>
          </div>
      ),
    },
  ];
  
  const totalSteps = steps.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {
            onClose();
        }
    }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2"><Sparkles className="text-primary w-6 h-6"/>Welcome to Scrapless!</DialogTitle>
          <DialogDescription>Let's quickly personalize your experience.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 min-h-0">
            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent className="-ml-4 h-full">
                    {steps.map((step, index) => (
                        <CarouselItem key={index} className="pl-4 flex flex-col">
                           {step.title !== 'Confirmation' && (
                                <Label className="font-semibold text-base mb-4">{step.title}</Label>
                            )}
                            <div className="flex-1 overflow-y-auto pr-2">
                                {step.content}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
        
        <DialogFooter className="p-6 border-t bg-secondary/50">
            <div className="w-full flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === currentStep ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30")}/>
                    ))}
                 </div>
                <div>
                     <Button variant="ghost" onClick={() => api?.scrollPrev()} disabled={currentStep === 0}>
                        Back
                    </Button>
                    {currentStep === totalSteps - 1 ? (
                         <Button onClick={handleSaveAndFinish} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Logging →
                        </Button>
                    ) : (
                        <Button onClick={() => api?.scrollNext()}>
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
