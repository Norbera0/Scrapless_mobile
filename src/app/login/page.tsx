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
                <div className="grid gap-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                        <Image src="/Scrapless Logo PNG - GREEN.png" alt="Scrapless Logo" width={40} height={40} />
                        <h1 className="text-2xl font-bold text-[#003726]">Scrapless</h1>
                    </div>
                    <p className="text-balance text-muted-foreground font-medium">
                        Transform food waste into savings.
                    </p>
                </div>
                <LoginForm />
            </div>
        </div>
    </div>
  )
}
