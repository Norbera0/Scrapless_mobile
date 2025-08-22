
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  PackagePlus, 
  Brain, 
  Leaf, 
  TrendingDown, 
  Users, 
  ChefHat,
  BarChart3,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Smart analysis of your consumption patterns to prevent waste before it happens"
  },
  {
    icon: Smartphone,
    title: "Quick Logging",
    description: "Snap a photo or use voice commands to log food waste in seconds"
  },
  {
    icon: ChefHat,
    title: "Recipe Suggestions",
    description: "Get personalized recipes based on what's expiring in your pantry"
  },
  {
    icon: BarChart3,
    title: "Impact Tracking",
    description: "Monitor your environmental and financial impact with detailed analytics"
  }
];

const stats = [
  { value: "40%", label: "Food waste reduction" },
  { value: "₱2,500", label: "Average monthly savings" },
  { value: "15kg", label: "CO₂ saved per month" },
  { value: "10k+", label: "Users reducing waste" }
];

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && mounted) {
      if (user) {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router, mounted]);

  // Show skeleton while checking auth status
  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, let the useEffect handle the redirect
  if (user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Image src="/Scrapless Logo PNG - GREEN2.png" alt="Scrapless Logo" width={40} height={40} className="rounded-lg" />
            <span className="text-xl font-bold">Scrapless</span>
          </div>
          <Button onClick={() => router.push('/login')} size="sm">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Food Waste Reduction
            </Badge>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl mx-auto">
              Turn Food Waste Into{' '}
              <span className="text-primary bg-clip-text">Smart Savings</span>
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg md:text-xl">
              Reduce food waste by up to 40% with AI-powered insights, smart pantry management, 
              and personalized recommendations. Save money while saving the planet.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => router.push('/login')}
            >
              Start Reducing Waste
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
            >
              <BarChart3 className="mr-2 h-5 w-5" />
              See Impact Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 py-16 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything You Need to{' '}
            <span className="text-primary">Reduce Waste</span>
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Our comprehensive platform combines AI technology with practical tools 
            to make reducing food waste effortless and rewarding.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="relative overflow-hidden border-0 bg-card/60 backdrop-blur-sm h-full hover:bg-card/80 transition-colors">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container px-4 py-16 md:px-6">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
            Simple Steps, Big Impact
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            Get started in minutes and see results from day one
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Track Your Pantry",
              description: "Add items to your digital pantry with photos or voice commands"
            },
            {
              step: "02", 
              title: "Get AI Insights",
              description: "Receive personalized recommendations and expiration alerts"
            },
            {
              step: "03",
              title: "Reduce & Save",
              description: "Follow smart suggestions to minimize waste and maximize savings"
            }
          ].map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 * index }}
              className="text-center"
            >
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                {step.step}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-16 md:px-6">
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
          <CardContent className="p-8 md:p-12">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Ready to Start Your Waste-Free Journey?
                </h2>
                <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
                  Join thousands of users who are already saving money and reducing their environmental impact
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="text-lg px-8"
                  onClick={() => router.push('/login')}
                >
                  <Leaf className="mr-2 h-5 w-5" />
                  Start Free Today
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  No credit card required
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex items-center gap-2">
              <Image src="/Scrapless Logo PNG - GREEN2.png" alt="Scrapless Logo" width={32} height={32} className="rounded-lg" />
              <span className="font-bold">Scrapless</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Scrapless. Reduce food waste intelligently.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
