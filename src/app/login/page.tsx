'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Leaf } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-green-600" />
          <div className="relative z-20 flex items-center text-2xl font-bold">
              <Leaf className="h-7 w-7 mr-2" />
              Scrapless
          </div>
          <div className="relative z-20 mt-auto">
              <blockquote className="space-y-2">
              <p className="text-lg">
                  “This app has completely changed how I think about food. I'm saving money and making a real impact. It's a must-have for any household!”
              </p>
              <footer className="text-sm">Sofia Reyes</footer>
              </blockquote>
          </div>
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
