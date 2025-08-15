
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
import { Landmark, LogOut, ChevronRight, User as UserIcon, Palette, Bookmark, ShieldCheck, TrendingUp, ThumbsDown, CheckCircle, BarChart, Info, Leaf, Star, ExternalLink, RefreshCw, Edit, Save, PiggyBank } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners, saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useGreenScoreStore } from '@/stores/greenScoreStore';
import { Gauge } from '@/components/ui/gauge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUserSettingsStore } from '@/stores/user-settings-store';


const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
}

const GreenScoreBreakdown = () => {
  const { breakdown } = useGreenScoreStore();
  
  const scoreItems = [
    { label: "Use Rate vs Waste", value: breakdown.useRatePoints, icon: CheckCircle, description: "Points from using more items than you waste." },
    { label: "High-Impact Waste", value: -breakdown.wastePenalty, icon: ThumbsDown, description: "Penalty for wasting high-carbon items like meat." },
    { label: "Savings Efficiency", value: breakdown.savingsRatioPoints, icon: TrendingUp, description: "Points for maximizing savings relative to waste value." },
    { label: "Solution Adoption", value: breakdown.solutionPoints, icon: Star, description: "Bonus for trying AI-suggested solutions." },
    { label: "Logging Consistency", value: breakdown.consistencyPoints, icon: BarChart, description: "Rewards for regular app usage." },
    { label: "Waste-Free Streak", value: breakdown.streakPoints, icon: Leaf, description: "Bonus for days since last waste log." },
  ];

  return (
    <div className="space-y-3">
        {scoreItems.map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/50">
                <div className="flex items-center gap-2">
                    <item.icon className={cn("w-4 h-4", item.value >= 0 ? 'text-green-600' : 'text-red-600')} />
                    <div className="flex items-center gap-1.5">
                        <p>{item.label}</p>
                         <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.description}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <p className={cn("font-semibold", item.value >= 0 ? 'text-green-700' : 'text-red-700')}>
                    {item.value >= 0 ? '+' : ''}{item.value}
                </p>
            </div>
        ))}
    </div>
  )
}

const GreenScoreSection = () => {
    const { score, badges, calculateScore, breakdown } = useGreenScoreStore();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = useState(false);
    
    useEffect(() => {
        calculateScore();
    }, [calculateScore]);

    const handleShare = () => {
        setIsSharing(true);
        console.log('Sharing mock score with BPI:', { score, segment: badges[0] || 'Beginner' });
        setTimeout(() => {
            toast({
                title: 'Score Shared (Mock)',
                description: `Your Green Score of ${score} has been securely shared with BPI.`,
            });
            setIsSharing(false);
        }, 1000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="text-green-600" />
                    BPI Green Profile Score (Mock)
                </CardTitle>
                <CardDescription>
                    Your household's sustainability rating, powered by your Scrapless data.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Gauge value={score} max={1000} />
                    <div className="flex-1 space-y-2">
                        {badges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {badges.map(badge => <Badge key={badge}>{badge}</Badge>)}
                            </div>
                        )}
                        <p className="text-muted-foreground">This score reflects your efficiency in managing food, impacting both your finances and the environment.</p>
                    </div>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="breakdown">
                        <AccordionTrigger>View Score Breakdown</AccordionTrigger>
                        <AccordionContent>
                           <GreenScoreBreakdown />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <Button variant="outline" onClick={calculateScore}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Score
                    </Button>
                    <Button onClick={handleShare} disabled={isSharing}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        {isSharing ? 'Sharing...' : 'Share with BPI (Mock)'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
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
        toast({ title: 'Savings goal updated!', description: `Your new goal is ₱${goal.toLocaleString()}.` });
        setIsEditing(false);
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="text-primary" />
                    Monthly Savings Goal
                </CardTitle>
                <CardDescription>
                    Set a target for your virtual savings each month.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isEditing ? (
                     <div className="flex items-center gap-2">
                        <Label htmlFor="savings-goal" className="whitespace-nowrap">Goal (₱)</Label>
                        <Input
                            id="savings-goal"
                            type="number"
                            value={goal}
                            onChange={(e) => setGoal(Number(e.target.value))}
                            className="text-lg font-semibold"
                        />
                    </div>
                ) : (
                    <p className="text-3xl font-bold text-center p-4 bg-secondary rounded-lg">
                        ₱{goal.toLocaleString()}
                    </p>
                )}
               
            </CardContent>
             <CardContent>
                 {isEditing ? (
                    <Button className="w-full" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Goal
                    </Button>
                ) : (
                    <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Change Goal
                    </Button>
                )}
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
                <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
                <p className="text-muted-foreground">Manage your account details and app preferences.</p>
            </div>

            {/* User Info Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-2xl">{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{user?.name || 'Scrapless User'}</CardTitle>
                            <CardDescription>{user?.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <SavingsGoalSection />
            <GreenScoreSection />

            {/* Main Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-5 h-5 text-primary" />
                            <p className="font-medium">Account Information</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>

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
                    
                    <div 
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => router.push('/bpi')}
                    >
                        <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-primary" />
                            <p className="font-medium">BPI Hub & Integrations</p>
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
