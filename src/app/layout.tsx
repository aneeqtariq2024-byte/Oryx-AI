import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

export const metadata = {
  title: 'Oryx AI — Workspace Studio',
  description: 'Oryx AI: Your intelligent workspace powered by multiple AI engines.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/oryx-logo.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/oryx-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={`antialiased ${plusJakarta.className}`}>{children}</body>
    </html>
  );
}