
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (values: z.infer<typeof formSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    } catch (error) {
      const authError = error as AuthError;
      let description = 'An unexpected error occurred. Please try again.';
      switch (authError.code) {
          case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
              description = "Invalid email or password. Please try again.";
              break;
          default:
              description = authError.message;
              break;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description,
      });
    }
  };

  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    if (!values.name) {
        toast({ variant: 'destructive', title: 'Sign-up failed', description: 'Please enter your name.' });
        return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });
      toast({
        title: 'Account created',
        description: `Welcome, ${values.name}!`,
      });
      router.push('/dashboard');
    } catch (error) {
        const authError = error as AuthError;
        let description = 'Could not create your account. Please try again.';
        switch(authError.code) {
            case 'auth/email-already-in-use':
                description = 'This email is already in use. Please sign in instead.';
                break;
            case 'auth/weak-password':
                description = 'The password is too weak. Please use at least 6 characters.';
                break;
            default:
                description = authError.message;
                break;
        }
        toast({
            variant: 'destructive',
            title: 'Sign-up Failed',
            description,
        });
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (authMode === 'signin') {
      await handleSignIn(values);
    } else {
      await handleSignUp(values);
    }
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {authMode === 'signup' && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>
       <div className="mt-4 text-center text-sm">
        {authMode === 'signin' ? (
          <>
            Don&apos;t have an account?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signup')}>
              Sign up
            </Button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => setAuthMode('signin')}>
              Sign in
            </Button>
          </>
        )}
      </div>
    </Form>
  );
}
