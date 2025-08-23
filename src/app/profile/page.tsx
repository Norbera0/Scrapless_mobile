
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
import { LogOut, ChevronRight, Palette, Bookmark, Edit, Save, PiggyBank, Sparkles, Shield, Users } from 'lucide-react';
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
import type { HouseholdSize } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

const HouseholdInfoSection = () => {
    const { user } = useAuth();
    const { settings, setSavingsGoal, setHouseholdSize } = useUserSettingsStore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [localSavingsGoal, setLocalSavingsGoal] = useState(settings.savingsGoal || 5000);
    const [householdSize, setHouseholdSizeState] = useState<HouseholdSize>(settings.householdSize || '2');

    useEffect(() => {
        setLocalSavingsGoal(settings.savingsGoal || 5000);
        setHouseholdSizeState(settings.householdSize || '2');
    }, [settings]);

    const handleSave = async () => {
        if (!user) return;
        setSavingsGoal(localSavingsGoal);
        setHouseholdSize(householdSize);
        await saveUserSettings(user.uid, { ...settings, savingsGoal: localSavingsGoal, householdSize });
        toast({ title: 'Household Info Updated!', description: `Your settings have been saved.` });
        setIsEditing(false);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="text-primary" />
                        Household Information
                    </CardTitle>
                    <Button size="sm" variant={isEditing ? 'default' : 'ghost'} onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Save' : 'Edit'}
                    </Button>
                </div>
                <CardDescription className="text-sm">
                    Manage your household size and monthly savings goal.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="household-size">How many people live in your household?</Label>
                    <Select
                        value={householdSize}
                        onValueChange={(value) => setHouseholdSizeState(value as HouseholdSize)}
                        disabled={!isEditing}
                    >
                        <SelectTrigger id="household-size">
                            <SelectValue placeholder="Select size..." />
                        </SelectTrigger>
                        <SelectContent>
                            {householdSizeOptions.map(option => (
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

            <div className="grid md:grid-cols-2 gap-4">
                <Card className="flex flex-col cursor-pointer hover:bg-secondary/50" onClick={() => router.push('/my-savings')}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><PiggyBank className="w-5 h-5 text-primary" />Virtual Savings</CardTitle>
                        <CardDescription className="text-sm">Review your savings from reducing waste.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                        <Button variant="outline" className="w-full" asChild><Link href="/my-savings">View Savings</Link></Button>
                    </CardContent>
                </Card>
                <Card className="flex flex-col cursor-pointer hover:bg-secondary/50" onClick={() => router.push('/rewards')}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="w-5 h-5 text-amber-500" />Green Points</CardTitle>
                        <CardDescription className="text-sm">Convert your points to BPI Rewards.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-end">
                        <Button variant="outline" className="w-full" asChild><Link href="/rewards">View Points</Link></Button>
                    </CardContent>
                </Card>
            </div>

            <HouseholdInfoSection />

            {/* Main Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Settings</CardTitle>
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
