
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { LogOut, ChevronRight, Palette, Bookmark, Shield, PencilRuler, Landmark } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cleanupListeners, saveUserSettings } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import Image from 'next/image';
import { Accordion, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProfilePolicyDialog } from '@/components/auth/ProfilePolicyDialog';
import { privacyPolicy, termsAndConditions } from '@/lib/legal';
import { Label } from '@/components/ui/label';
import { useCoachStore } from '@/stores/coach-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { useShoppingListStore } from '@/stores/shopping-list-store';
import { useChatStore } from '@/stores/chat-store';
import { useWasteInsightStore } from '@/stores/waste-insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';

const getInitials = (name?: string | null) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
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
            // 1. Reset the in-memory state of all stores
            useCoachStore.getState().setAnalysis(null);
            useCoachStore.getState().setSolutions(null);
            useRecipeStore.getState().clearRecipes();
            useShoppingListStore.getState().setGeneratedList(null);
            useChatStore.getState().clearMessages();
            useWasteInsightStore.getState().setInsight(null);
            usePantryLogStore.getState().reset(); // Resets pantry log draft

            // 2. Clear persisted storage as a failsafe
            useCoachStore.persist.clearStorage();
            useRecipeStore.persist.clearStorage();
            useShoppingListStore.persist.clearStorage();
            useChatStore.persist.clearStorage();
            useWasteInsightStore.persist.clearStorage();
            
            // 3. Clean up all Firestore listeners
            cleanupListeners();
            
            // 4. Sign out from Firebase
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

             <Card 
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => router.push('/user-preference')}
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <PencilRuler className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">User Preferences</CardTitle>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardDescription>
                        Update your household, lifestyle, and food waste goals to get better recommendations.
                    </CardDescription>
                </CardHeader>
            </Card>
            
            <Card 
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => router.push('/bpi')}
            >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Landmark className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">BPI Integration</CardTitle>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <CardDescription>
                       Manage your savings transfers and rewards points.
                    </CardDescription>
                </CardHeader>
            </Card>


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
