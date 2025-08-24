import { Inter, Playfair_Display } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { AppLayout } from './AppLayout';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: '700', variable: '--font-playfair-display' });

export const metadata: Metadata = {
  title: 'Scrapless',
  description: 'Reduce food waste intelligently.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        
      </head>
      <body className={`${inter.variable} ${playfairDisplay.variable} font-body`}>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
