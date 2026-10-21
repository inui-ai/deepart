import { Fragment_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Display + text: Switzer (Fontshare, self-hosted via next/font/local).
export const switzer = localFont({
  src: [
    { path: '../fonts/switzer-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../fonts/switzer-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/switzer-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-switzer',
  display: 'swap',
});

// Data voice: Fragment Mono, only ever for real parameters.
export const fragment = Fragment_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-fragment',
  display: 'swap',
});
