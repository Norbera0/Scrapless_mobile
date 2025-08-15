import { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Set persistence based on the checkbox
      const persistence = keepLoggedIn ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="johndoe@email.com"
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
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
            id="keep-logged-in"
            checked={keepLoggedIn}
            onCheckedChange={(checked) => setKeepLoggedIn(checked as boolean)}
        />
        <Label htmlFor="keep-logged-in" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Keep me logged in
        </Label>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging In...' : 'Login'}
      </Button>
    </form>
  );
}
