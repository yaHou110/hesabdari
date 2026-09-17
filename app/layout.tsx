import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Himoora Financial Suite | ترازحساب ابری',
  description:
    'Enterprise bilingual (Persian/English RTL/LTR) modern accounting platform inspired by EasyBooks, QuickBooks, and Xero with double-entry ledger invariants, financial command center, multi-tier plans, and intelligent financial analysis.',
  openGraph: {
    title: 'Himoora Financial Suite | ترازحساب ابری',
    description:
      'Enterprise bilingual (Persian/English RTL/LTR) modern accounting platform inspired by EasyBooks, QuickBooks, and Xero.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Himoora Financial Suite | ترازحساب ابری',
    description:
      'Enterprise bilingual (Persian/English RTL/LTR) modern accounting platform inspired by EasyBooks, QuickBooks, and Xero.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
