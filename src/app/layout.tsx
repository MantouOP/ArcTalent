import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/language-provider';
import { DisplayPreferencesProvider } from '@/components/display-preferences-provider';
import { ProfilePicturesProvider } from '@/components/profile-pictures-provider';
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
        <LanguageProvider>
          <DisplayPreferencesProvider>
            <ProfilePicturesProvider>{children}</ProfilePicturesProvider>
          </DisplayPreferencesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
