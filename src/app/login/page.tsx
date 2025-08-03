
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PackagePlus, Leaf, Sparkles, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const stats = [
  { value: "40%", label: "Food waste reduction" },
  { value: "₱2,500", label: "Average monthly savings" },
  { value: "15kg", label: "CO₂ saved per month" }
];

const features = [
  {
    icon: "🤖",
    title: "AI-Powered Insights",
    description: "Smart recommendations to reduce waste"
  },
  {
    icon: "📱", 
    title: "Quick Logging",
    description: "Snap photos to track food waste instantly"
  },
  {
    icon: "💡",
    title: "Smart Tips",
    description: "Personalized advice for better habits"
  }
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl"></div>
      </div>

      <div className="w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left side - Branding & Features */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Logo and Title */}
          <div className="text-center md:text-left">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-3 mb-6"
            >
              <Image src="/logo.jpg" alt="Scrapless Logo" width={56} height={56} className="rounded-2xl shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Scrapless
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Leaf className="h-3 w-3 text-green-600" />
                  Reduce food waste intelligently
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Turn Food Waste Into{' '}
                <span className="text-primary">Smart Savings</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Join thousands of users reducing food waste by up to 40% with AI-powered insights and smart pantry management.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50"
              >
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Why choose Scrapless?</h3>
            </div>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-card/30 rounded-lg border border-border/30 hover:bg-card/50 transition-colors"
              >
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h4 className="font-medium text-foreground">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <Card className="w-full max-w-md bg-card/80 backdrop-blur-lg border-border/50 shadow-2xl">
            <CardHeader className="text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <CardTitle className="text-2xl font-bold mb-2">Welcome!</CardTitle>
                <CardDescription className="text-base">
                  Sign in or create an account to start reducing food waste
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <LoginForm />
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingDown className="h-3 w-3 text-green-600" />
          <span>Reducing food waste, one household at a time</span>
        </div>
      </motion.div>
    </main>
  );
}
