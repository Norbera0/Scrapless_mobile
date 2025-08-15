'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Leaf } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#F4F4F4]">
        {/* Top Section with Image */}
        <div className="relative w-full h-[40vh] bg-[#003726] flex items-center justify-center overflow-hidden">
            <Image
                src="/log_in_page/log_in_bg.png"
                alt="A bowl of healthy food"
                layout="fill"
                className="object-cover"
            />
        </div>

        {/* Bottom Section with Form */}
        <div className="flex-1 flex items-start justify-center pt-10">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold text-[#003726]">Welcome Back to Scrapless</h1>
                    <p className="text-balance text-muted-foreground font-medium">
                        Transform food waste into savings - you're just one login away from making every meal count!
                    </p>
                    <p className="text-sm text-muted-foreground pt-2">
                        Enter your email below to access your account
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    </div>
  )
}
