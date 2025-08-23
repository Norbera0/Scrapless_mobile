
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { LogOut, ChevronRight, Palette, Bookmark, Edit, Save, PiggyBank, Sparkles, Shield, Users, Utensils, Heart, ShoppingBag, Target, PencilRuler } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners, saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import Image from 'next/image';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProfilePolicyDialog } from '@/components/auth/ProfilePolicyDialog';
import { privacyPolicy, termsAndConditions } from '@/lib/legal';
import type { HouseholdSize, MonthlyBudget, DietaryRestriction, CookingFrequency, ShoppingLocation, UserGoal } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';


const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

const householdSizeOptions: { value: HouseholdSize, label: string }[] = [
    { value: '1', label: 'Just me (1)' },
    { value: '2', label: '2 people' },
    { value: '3-4', label: '3-4 people' },
    { value: '5+', label: '5+ people' }
];

const budgetOptions: { value: MonthlyBudget, label: string }[] = [
    { value: 'under_3k', label: '₱3,000 or less' },
    { value: '3k_6k', label: '₱3,000 - ₱6,000' },
    { value: '6k_10k', label: '₱6,000 - ₱10,000' },
    { value: 'over_10k', label: '₱10,000+' }
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

const HouseholdInfoSection = () => {
    const { user } = useAuth();
    const { settings, setSavingsGoal, setHouseholdSize, setMonthlyBudget } = useUserSettingsStore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [localSavingsGoal, setLocalSavingsGoal] = useState(settings.savingsGoal);
    const [householdSize, setHouseholdSizeState] = useState<HouseholdSize>(settings.householdSize || '2');
    const [monthlyBudget, setMonthlyBudgetState] = useState<MonthlyBudget>(settings.monthlyBudget || '6k_10k');

    useEffect(() => {
        setLocalSavingsGoal(settings.savingsGoal);
        setHouseholdSizeState(settings.householdSize || '2');
        setMonthlyBudgetState(settings.monthlyBudget || '6k_10k');
    }, [settings]);

    const handleSave = async () => {
        if (!user || !localSavingsGoal) return;
        setSavingsGoal(localSavingsGoal);
        setHouseholdSize(householdSize);
        setMonthlyBudget(monthlyBudget);
        await saveUserSettings(user.uid, { ...settings, savingsGoal: localSavingsGoal, householdSize, monthlyBudget });
        toast({ title: 'Household Info Updated!', description: `Your settings have been saved.` });
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="text-primary" />
                        Household & Budget
                    </CardTitle>
                    <Button size="sm" variant={isEditing ? 'default' : 'ghost'} onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="household-size">Household Size</Label>
                    <Select value={householdSize} onValueChange={(value) => setHouseholdSizeState(value as HouseholdSize)} disabled={!isEditing}>
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
                    <Select value={monthlyBudget} onValueChange={(value) => setMonthlyBudgetState(value as MonthlyBudget)} disabled={!isEditing}>
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
    )
}

const FoodAndLifestyleSection = () => {
    const { user } = useAuth();
    const { settings, setDietaryRestrictions, setCookingFrequency, setShoppingLocations, setNotes } = useUserSettingsStore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [localDietary, setLocalDietary] = useState<DietaryRestriction[]>(settings.dietaryRestrictions || []);
    const [localFrequency, setLocalFrequency] = useState<CookingFrequency>(settings.cookingFrequency || 'daily');
    const [localShopping, setLocalShopping] = useState<ShoppingLocation[]>(settings.shoppingLocations || ['supermarket']);
    const [localNotes, setLocalNotes] = useState(settings.notes || '');

    useEffect(() => {
        setLocalDietary(settings.dietaryRestrictions || []);
        setLocalFrequency(settings.cookingFrequency || 'daily');
        setLocalShopping(settings.shoppingLocations || ['supermarket']);
        setLocalNotes(settings.notes || '');
    }, [settings]);

    const handleSave = async () => {
        if (!user) return;
        setDietaryRestrictions(localDietary);
        setCookingFrequency(localFrequency);
        setShoppingLocations(localShopping);
        setNotes(localNotes);

        await saveUserSettings(user.uid, { 
            ...settings, 
            dietaryRestrictions: localDietary, 
            cookingFrequency: localFrequency, 
            shoppingLocations: localShopping,
            notes: localNotes
        });
        toast({ title: 'Lifestyle Info Updated!', description: 'Your preferences have been saved.' });
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Heart className="text-primary" /> Food & Lifestyle
                    </CardTitle>
                    <Button size="sm" variant={isEditing ? 'default' : 'ghost'} onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </Button>
                </div>
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
    );
}

const GoalSection = () => {
    const { user } = useAuth();
    const { settings, setPrimaryGoal } = useUserSettingsStore();
    const { toast } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [localGoal, setLocalGoal] = useState<UserGoal>(settings.primaryGoal || 'save_money');
    
     useEffect(() => {
        setLocalGoal(settings.primaryGoal || 'save_money');
    }, [settings]);
    
    const handleSave = async () => {
        if (!user) return;
        setPrimaryGoal(localGoal);
        await saveUserSettings(user.uid, { ...settings, primaryGoal: localGoal });
        toast({ title: 'Goal Updated!', description: 'Your main goal has been saved.' });
        setIsEditing(false);
    };
    
    return (
         <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="text-primary" /> Your Goal
                    </CardTitle>
                     <Button size="sm" variant={isEditing ? 'default' : 'ghost'} onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { settings, setSettings } = useUserSettingsStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            cleanupListeners();
            await signOut(auth);
            toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
            toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.' });
            setIsLoggingOut(false);
        }
    };
    
    const handleLanguageToggle = async (isChecked: boolean) => {
        if (!user) return;
        const newLang = isChecked ? 'fil' : 'en';
        const newSettings = { ...settings, language: newLang };
        setSettings(newSettings);
        await saveUserSettings(user.uid, newSettings);
        toast({
            title: 'Language Switched',
            description: `App language set to ${newLang === 'fil' ? 'Filipino' : 'English'}. (UI mock-up)`,
        });
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <Image src="/Scrapless Logo PNG - GREEN2.png" alt="Scrapless Logo" width={32} height={32} />
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Scrapless Profile</h1>
                </div>
                <p className="text-muted-foreground text-sm">Manage your account details and app preferences.</p>
            </div>

            {/* User Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl">{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-xl">{user?.name || 'Scrapless User'}</CardTitle>
                            <CardDescription>{user?.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <HouseholdInfoSection />
            <FoodAndLifestyleSection />
            <GoalSection />

            {/* Main Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">App Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => router.push('/saves')}
                    >
                        <div className="flex items-center gap-3">
                            <Bookmark className="w-5 h-5 text-primary" />
                            <p className="font-medium">My Saves</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Palette className="w-5 h-5 text-primary" />
                            <div>
                                <p className="font-medium">Language</p>
                                <p className="text-xs text-muted-foreground">Switch between English and Filipino.</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="lang-en" className={settings.language === 'en' ? 'font-semibold' : 'text-muted-foreground'}>EN</Label>
                            <Switch 
                                id="language-switch"
                                checked={settings.language === 'fil'}
                                onCheckedChange={handleLanguageToggle}
                            />
                            <Label htmlFor="lang-fil" className={settings.language === 'fil' ? 'font-semibold' : 'text-muted-foreground'}>FIL</Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legal Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Legal</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="terms">
                            <AccordionTrigger>
                                <ProfilePolicyDialog
                                  linkText="Terms & Conditions"
                                  title="Terms & Conditions"
                                  content={termsAndConditions}
                                />
                            </AccordionTrigger>
                        </AccordionItem>
                        <AccordionItem value="privacy">
                            <AccordionTrigger>
                                <ProfilePolicyDialog
                                  linkText="Privacy Policy"
                                  title="Privacy Policy"
                                  content={privacyPolicy}
                                />
                            </AccordionTrigger>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
            
            {/* Logout Button */}
            <Card>
                <CardContent className="p-3">
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-red-50"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        <span className="font-semibold">Log Out</span>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
