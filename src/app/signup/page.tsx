
'use client';

import { SignUpForm } from '@/components/auth/SignUpForm';
import { Leaf } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row-reverse bg-[#F4F4F4]">
        {/* Right Section with Image (Desktop) / Top Image (Mobile) */}
        <div className="relative w-full h-[30vh] md:h-screen md:w-1/2">
             {/* Mobile Image */}
            <Image
                src="/log_in_page/log_in_bg_2.png"
                alt="A bowl of healthy food on mobile"
                layout="fill"
                className="object-cover md:hidden"
            />
             {/* Desktop Image */}
            <Image
                src="/log_in_page/log_in_bg_desktop.png"
                alt="A bowl of healthy food on desktop"
                layout="fill"
                className="hidden md:block object-cover"
            />
        </div>

        {/* Left Section with Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
            <div className="mx-auto grid w-full max-w-sm gap-6">
                <div className="grid gap-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <h1 className="text-2xl font-bold text-[#003726]">Scrapless</h1>
                    </div>
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Create an account</h1>
                        <p className="text-balance text-muted-foreground">
                            Enter your details to get started
                        </p>
                    </div>
                </div>
                <SignUpForm />
                 <div className="text-center text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="underline font-medium text-primary">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    </div>
  )
}
