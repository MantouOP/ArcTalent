import type { Metadata } from 'next';
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
      <body>{children}</body>
    </html>
  );
}
