
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

        {/* Bottom Section with Form */}
        <div className="flex-1 flex items-start justify-center pt-10">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-4">
                    <div className="flex items-center justify-center gap-3">
                        <Image src="/Scrapless Logo PNG - GREEN.png" alt="Scrapless Logo" width={40} height={40} />
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
            </div>
        </div>
    </div>
  )
}
