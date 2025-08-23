
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Edit, Save, Users, Heart, Target, ArrowLeft } from 'lucide-react';
import { saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import type { HouseholdSize, MonthlyBudget, DietaryRestriction, CookingFrequency, ShoppingLocation, UserGoal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

const householdSizeOptions: { value: HouseholdSize, label: string }[] = [
    { value: '1', label: 'Just me (1)' },
    { value: '2', label: '2 people' },
    { value: '3-4', label: '3-4 people' },
    { value: '5+', label: '5+ people' }
];

const budgetOptions: { value: MonthlyBudget, label: string }[] = [
    { value: 'under_3k', label: '₱3,000 or less' },
    { value: '3k_6k', 'label': '₱3,000 - ₱6,000' },
    { value: '6k_10k', 'label': '₱6,000 - ₱10,000' },
    { value: 'over_10k', 'label': '₱10,000+' }
];

const dietaryOptions: { value: DietaryRestriction, label: string }[] = [
    { value: 'no_pork', label: 'No pork' },
    { value: 'no_beef', label: 'No beef' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'diabetic_friendly', label: 'Diabetic-friendly' },
    { value: 'allergies', label: 'Food allergies' }
];

const cookingFrequencyOptions: { value: CookingFrequency, label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: '4_5_times', label: '4-5 times a week' },
    { value: '2_3_times', label: '2-3 times a week' },
    { value: 'rarely', label: 'Rarely/Weekends only' }
];

const shoppingLocationOptions: { value: ShoppingLocation, label: string }[] = [
    { value: 'wet_market', label: 'Wet market' },
    { value: 'supermarket', label: 'Supermarket' },
    { value: 'online', label: 'Online delivery' },
    { value: 'mixed', label: 'Mix of places' }
];

const goalOptions: { value: UserGoal, label: string }[] = [
    { value: 'save_money', label: 'Save money on groceries' },
    { value: 'reduce_waste', label: 'Reduce food waste by half' },
    { value: 'meal_planning', label: 'Learn better meal planning' },
    { value: 'stop_spoiling', label: 'Stop throwing away spoiled food' }
];


export default function UserPreferencePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { 
        settings, 
        setSavingsGoal, 
        setHouseholdSize, 
        setMonthlyBudget, 
        setDietaryRestrictions, 
        setCookingFrequency, 
        setShoppingLocations, 
        setPrimaryGoal,
        setNotes 
    } = useUserSettingsStore();
    
    const [isEditing, setIsEditing] = useState(false);

    // Local states for editing
    const [localSavingsGoal, setLocalSavingsGoal] = useState(settings.savingsGoal);
    const [localHouseholdSize, setLocalHouseholdSize] = useState<HouseholdSize>(settings.householdSize || '2');
    const [localMonthlyBudget, setLocalMonthlyBudget] = useState<MonthlyBudget>(settings.monthlyBudget || '6k_10k');
    const [localDietary, setLocalDietary] = useState<DietaryRestriction[]>(settings.dietaryRestrictions || []);
    const [localFrequency, setLocalFrequency] = useState<CookingFrequency>(settings.cookingFrequency || 'daily');
    const [localShopping, setLocalShopping] = useState<ShoppingLocation[]>(settings.shoppingLocations || ['supermarket']);
    const [localGoal, setLocalGoal] = useState<UserGoal>(settings.primaryGoal || 'save_money');
    const [localNotes, setLocalNotes] = useState(settings.notes || '');

    useEffect(() => {
        setLocalSavingsGoal(settings.savingsGoal);
        setLocalHouseholdSize(settings.householdSize || '2');
        setLocalMonthlyBudget(settings.monthlyBudget || '6k_10k');
        setLocalDietary(settings.dietaryRestrictions || []);
        setLocalFrequency(settings.cookingFrequency || 'daily');
        setLocalShopping(settings.shoppingLocations || ['supermarket']);
        setLocalGoal(settings.primaryGoal || 'save_money');
        setLocalNotes(settings.notes || '');
    }, [settings, isEditing]); // Reset local state if user cancels editing

    const handleSave = async () => {
        if (!user) return;

        const newSettings = {
            ...settings,
            savingsGoal: localSavingsGoal,
            householdSize: localHouseholdSize,
            monthlyBudget: localMonthlyBudget,
            dietaryRestrictions: localDietary,
            cookingFrequency: localFrequency,
            shoppingLocations: localShopping,
            primaryGoal: localGoal,
            notes: localNotes,
        };

        // Update Zustand store
        setSavingsGoal(localSavingsGoal);
        setHouseholdSize(localHouseholdSize);
        setMonthlyBudget(localMonthlyBudget);
        setDietaryRestrictions(localDietary);
        setCookingFrequency(localFrequency);
        setShoppingLocations(localShopping);
        setPrimaryGoal(localGoal);
        setNotes(localNotes);

        // Save to Firestore
        await saveUserSettings(user.uid, newSettings);
        toast({ title: 'Preferences Updated!', description: 'Your settings have been saved.' });
        setIsEditing(false);
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                     <Button variant="ghost" onClick={() => router.push('/profile')} className="-ml-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Profile
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Preferences</h1>
                    <p className="text-muted-foreground text-sm">Tell us about your household and lifestyle for a personalized experience.</p>
                </div>
                 <Button size="sm" variant={isEditing ? 'default' : 'outline'} onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                    {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Save All' : 'Edit All'}
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="text-primary" />
                        Household & Budget
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="household-size">Household Size</Label>
                        <Select value={localHouseholdSize} onValueChange={(value) => setLocalHouseholdSize(value as HouseholdSize)} disabled={!isEditing}>
                            <SelectTrigger id="household-size"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {householdSizeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="monthly-budget">Monthly Grocery Budget</Label>
                        <Select value={localMonthlyBudget} onValueChange={(value) => setLocalMonthlyBudget(value as MonthlyBudget)} disabled={!isEditing}>
                            <SelectTrigger id="monthly-budget"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {budgetOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="savings-goal">Monthly Savings Goal</Label>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₱</span>
                            <Input
                                id="savings-goal"
                                type="number"
                                value={localSavingsGoal}
                                onChange={(e) => setLocalSavingsGoal(Number(e.target.value))}
                                className="font-semibold"
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="text-primary" /> Food & Lifestyle
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Dietary Restrictions</Label>
                        <div className="space-y-2">
                            {dietaryOptions.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.value}
                                        checked={localDietary.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                            const newDietary = checked
                                                ? [...localDietary, option.value]
                                                : localDietary.filter(item => item !== option.value);
                                            setLocalDietary(newDietary);
                                        }}
                                        disabled={!isEditing}
                                    />
                                    <label htmlFor={option.value} className="text-sm font-medium leading-none">
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cooking-frequency">Cooking Frequency</Label>
                        <Select value={localFrequency} onValueChange={(value) => setLocalFrequency(value as CookingFrequency)} disabled={!isEditing}>
                            <SelectTrigger id="cooking-frequency"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {cookingFrequencyOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="grid gap-2">
                        <Label>Shopping Locations</Label>
                        <div className="space-y-2">
                           {shoppingLocationOptions.map(option => (
                                <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={option.value}
                                        checked={localShopping.includes(option.value)}
                                        onCheckedChange={(checked) => {
                                            const newShopping = checked
                                                ? [...localShopping, option.value]
                                                : localShopping.filter(item => item !== option.value);
                                            setLocalShopping(newShopping);
                                        }}
                                        disabled={!isEditing}
                                    />
                                    <label htmlFor={option.value} className="text-sm font-medium leading-none">
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="text-primary" /> Your Goal & Notes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="primary-goal">What would you like to achieve?</Label>
                        <Select value={localGoal} onValueChange={(value) => setLocalGoal(value as UserGoal)} disabled={!isEditing}>
                            <SelectTrigger id="primary-goal"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {goalOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Other Notes/Preferences</Label>
                        <Textarea 
                            id="notes" 
                            placeholder="e.g. family loves spicy food, busy on weekends..."
                            value={localNotes}
                            onChange={(e) => setLocalNotes(e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
