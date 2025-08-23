
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PolicyDialog } from './PolicyDialog';
import { privacyPolicy, termsAndConditions } from '@/lib/legal';


export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToPrivacy || !agreedToTerms) {
      toast({
        variant: 'destructive',
        title: 'Agreement Required',
        description: 'You must agree to both the Privacy Policy and Terms & Conditions.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's profile with their name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      toast({ title: 'Account Created!', description: 'Welcome to Scrapless! Let\'s get you set up.' });
      router.push('/dashboard?onboarding=true');
    } catch (error: any) {
      console.error('Sign up failed:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Juan dela Cruz"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="privacy" checked={agreedToPrivacy} onCheckedChange={(checked) => setAgreedToPrivacy(!!checked)} />
          <Label htmlFor="privacy" className="text-sm font-normal">
            I agree to the{' '}
            <PolicyDialog
              linkText="Privacy Policy"
              title="Privacy Policy"
              content={privacyPolicy}
            />
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(!!checked)} />
          <Label htmlFor="terms" className="text-sm font-normal">
            I agree to the{' '}
            <PolicyDialog
              linkText="Terms & Conditions"
              title="Terms & Conditions"
              content={termsAndConditions}
            />
          </Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !agreedToPrivacy || !agreedToTerms}>
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</> : 'Create Account'}
      </Button>
    </form>
  );
}
