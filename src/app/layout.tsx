import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JO Cars | أفضل منصة أردنية لبيع وشراء السيارات',
    template: '%s | JO Cars',
  },
  description: 'أفضل منصة أردنية متخصصة في بيع وشراء السيارات. ابحث عن سيارتك المثالية من آلاف السيارات الجديدة والمستعملة في الأردن.',
  keywords: ['سيارات', 'بيع سيارات', 'شراء سيارات', 'الأردن', 'سوق السيارات', 'JO Cars'],
  openGraph: {
    type: 'website',
    locale: 'ar_JO',
    siteName: 'JO Cars',
    title: 'JO Cars | أفضل منصة أردنية لبيع وشراء السيارات',
    description: 'أفضل منصة أردنية متخصصة في بيع وشراء السيارات',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <Header />
          <main className="pt-20 min-h-screen pb-16 lg:pb-0">
            {children}
          </main>
          <Footer />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
