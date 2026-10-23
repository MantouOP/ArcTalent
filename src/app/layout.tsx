import type { Metadata } from 'next';
import { UnicornBackground } from '@/components/unicorn-background';
import './globals.css';
export const metadata: Metadata = {
  title: 'ArcTalent — Your next chapter, mapped',
  description:
    'Explore transferable skills and practical learning pathways across different AI futures.',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <UnicornBackground />
        {children}
      </body>
    </html>
  );
}
