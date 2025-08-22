
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
import { LogOut, ChevronRight, Palette, Bookmark, Edit, Save, PiggyBank, Sparkles } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners, saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import Image from 'next/image';
import Link from 'next/link';

const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

const SavingsGoalSection = () => {
    const { user } = useAuth();
    const { settings, setSavingsGoal } = useUserSettingsStore();
    const [isEditing, setIsEditing] = useState(false);
    const [goal, setGoal] = useState(settings.savingsGoal || 5000);
    const { toast } = useToast();

    useEffect(() => {
        setGoal(settings.savingsGoal || 5000);
    }, [settings.savingsGoal]);

    const handleSave = async () => {
        if (!user) return;
        setSavingsGoal(goal);
        await saveUserSettings(user.uid, { ...settings, savingsGoal: goal });
        toast({ title: 'Savings goal updated!', description: `Your new monthly goal is ₱${goal.toLocaleString()}.` });
        setIsEditing(false);
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <PiggyBank className="text-primary" />
                    Monthly Savings Goal
                </CardTitle>
                <CardDescription className="text-sm">
                    Set a target for your virtual savings each month.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-2">
                    <Label htmlFor="savings-goal" className="whitespace-nowrap">₱</Label>
                    <Input
                        id="savings-goal"
                        type="number"
                        value={goal}
                        onChange={(e) => setGoal(Number(e.target.value))}
                        className="text-base font-semibold"
                        disabled={!isEditing}
                    />
                    {isEditing ? (
                         <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4" />
                        </Button>
                    ) : (
                         <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                            <Edit className="w-4 h-4" />
                        </Button>
                    )}
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

            <SavingsGoalSection />

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
