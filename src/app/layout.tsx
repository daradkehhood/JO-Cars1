import type { Metadata } from 'next';
import { Providers } from '@/components/layout/Providers';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JO Cars | أفضل منصة أردنية لبيع وشراء السيارات',
    template: '%s | JO Cars',
  },
  description: 'أفضل منصة أردنية متخصصة في بيع وشراء السيارات. ابحث عن سيارتك المثالية من آلاف السيارات الجديدة والمستعملة في الأردن.',
  keywords: ['سيارات', 'بيع سيارات', 'شراء سيارات', 'الأردن', 'سوق السيارات', 'JO Cars'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Tajawal:wght@300;400;500;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
