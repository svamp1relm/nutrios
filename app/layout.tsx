import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const sans = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-ibm',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Health Coach Agent',
  description: 'Персональный wellness-агент: план на день и проверка безопасности.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={cn(sans.variable, mono.variable, 'font-sans')}>
      <body>
        <a
          href="#task"
          className="fixed left-3 top-3 z-50 -translate-y-16 rounded-lg bg-primary px-3.5 py-2.5 font-medium text-primary-foreground focus:translate-y-0 focus-visible:translate-y-0"
        >
          К полю задачи
        </a>
        {children}
      </body>
    </html>
  );
}
