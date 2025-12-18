import { Public_Sans } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { LoadingOverlayProvider } from '@/contexts/LoadingOverlayContext';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import NavigationLoadingDetector from '@/components/NavigationLoadingDetector';

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get messages for the default locale
  const messages = await getMessages();

  return (
    <html className="light" lang="ms" suppressHydrationWarning>
      <body className={publicSans.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <LoadingOverlayProvider>
            <NavigationLoadingDetector />
            {children}
            <LoadingOverlay />
          </LoadingOverlayProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
