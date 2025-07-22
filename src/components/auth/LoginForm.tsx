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
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  // For simplicity in this demo, we'll use a fixed password.
  // In a real app, you would have a password field here.
});

const DEMO_PASSWORD = "password123"; // This should be handled securely

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        await signInWithEmailAndPassword(auth, values.email, DEMO_PASSWORD);
        toast({
          title: 'Login successful',
          description: `Welcome back, ${values.name}!`,
        });
        router.push('/dashboard');
    } catch (error) {
        const authError = error as AuthError;
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
            // User doesn't exist, so create a new account
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, DEMO_PASSWORD);
                await updateProfile(userCredential.user, { displayName: values.name });
                toast({
                  title: 'Account created',
                  description: `Welcome, ${values.name}!`,
                });
                router.push('/dashboard');
            } catch (createError) {
                 const createAuthError = createError as AuthError;
                 toast({
                    variant: 'destructive',
                    title: 'Sign up failed',
                    description: createAuthError.message || 'Could not create your account. Please try again.',
                });
            }
        } else {
             toast({
                variant: 'destructive',
                title: 'Login failed',
                description: authError.message || 'An unexpected error occurred. Please try again.',
            });
        }
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <p className="text-xs text-muted-foreground text-center">
            For this demo, authentication is simplified. No password is needed.
        </p>
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Please wait...' : 'Continue'}
        </Button>
      </form>
    </Form>
  );
}
