
'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Navigation Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white">
        <div className="flex justify-between items-center p-5 md:px-10">
          <div className="flex items-center text-2xl font-semibold text-[#2d5a4a]">
            🌿 Scrapless
          </div>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-gray-700 font-medium hover:text-[#2d5a4a] transition-colors">
              How It Works
            </Link>
            <Link href="#" className="text-gray-700 font-medium hover:text-[#2d5a4a] transition-colors">
              About
            </Link>
            <Link href="#" className="flex items-center gap-2 bg-gray-50 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
              <User className="h-4 w-4" />
              Log In
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex w-full min-h-screen">
        {/* Left side - Background Image */}
        <div 
          className="flex-1 bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: "url('/log-in-bg.jpg')"
          }}
        >
          {/* This div will show the background image */}
        </div>

        {/* Right side - Login Form */}
        <div className="flex-1 bg-gradient-to-bl from-[#2d5a4a] to-[#1e3d33] flex items-center justify-center p-10">
          <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-800 mb-2">Log in</h1>
              <p className="text-gray-600 text-sm">Enter your email and password</p>
            </div>
            
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Mobile Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .flex {
            flex-direction: column;
          }
          .flex-1:first-child {
            min-height: 40vh;
          }
          .absolute {
            position: relative;
          }
        }
      `}</style>
    </div>
  );
}
