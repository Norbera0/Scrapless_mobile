
'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { Leaf } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F4F4F4]">
        {/* Left Section with Image */}
        <div className="relative w-full h-[30vh] md:h-screen md:w-1/2">
            <Image
                src="/log_in_page/log_in_bg_3.png"
                alt="A bowl of healthy food"
                layout="fill"
                className="object-cover"
            />
        </div>

        {/* Right Section with Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
            <div className="mx-auto grid w-full max-w-sm gap-6">
                <div className="grid gap-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-2xl font-bold text-[#003726]">Scrapless</h1>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Log in</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your email and password
                        </p>
                    </div>
                </div>
                <LoginForm />
                <div className="text-center text-sm">
                    Don't have an account?{' '}
                    <Link href="/signup" className="underline font-medium text-primary">
                        Create one
                    </Link>
                </div>
            </div>
        </div>
    </div>
  )
}
