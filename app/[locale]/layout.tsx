import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing, type Locale } from '@/i18n/routing';
import { Providers } from '@/lib/providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LanguageBanner } from '@/components/layout/language-banner';
import { OrganizationStructuredData } from '@/components/seo/structured-data';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for the current locale
  const messages = await getMessages();

  // Render html/body here to have access to locale for lang attribute
  return (
    <html lang={locale} suppressHydrationWarning>
      {/* Umami Analytics - Privacy-friendly, cookie-free tracking */}
      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
        <Script
          defer
          src={process.env.NEXT_PUBLIC_UMAMI_URL}
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          data-domains="park.fan"
          data-do-not-track="true"
        />
      )}
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <OrganizationStructuredData />
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <LanguageBanner currentLocale={locale as Locale} />
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer locale={locale} />
            </div>
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
