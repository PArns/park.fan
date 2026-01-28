/* eslint-disable react/no-unescaped-entities */
import { getTranslations } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { setRequestLocale } from 'next-intl/server';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { LocaleContent } from '@/components/common/locale-content';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ExternalLink } from 'lucide-react';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface ImpressumPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: ImpressumPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'impressum' });
  const ogImageUrl = getOgImageUrl([locale, 'impressum']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/impressum`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/${locale}/impressum`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/impressum`),
        'x-default': '/en/impressum',
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ImpressumPage({ params }: ImpressumPageProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <LocaleContent
          locale={locale as 'de' | 'en'}
          de={<h1 className="mb-8 text-4xl font-bold">Impressum</h1>}
          en={<h1 className="mb-8 text-4xl font-bold">Imprint</h1>}
        />

        <LocaleContent
          locale={locale as 'de' | 'en'}
          de={
            <div className="space-y-6 text-base leading-7">
              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
                Angaben gemäß § 5 TMG
              </h2>

              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
              </address>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Kontakt</h3>
              <p className="mb-4">
                E-Mail:{' '}
                <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[ät]park.fan" />
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Redaktionell verantwortlich</h3>
              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
              </address>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p className="mb-4">
                Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Haftungsausschluss
              </h2>
              <p className="mb-4">
                Diese Webseite ist keine offizielle Webseite der hier aufgeführten Freizeit- und
                Themenparks. Die angezeigten Wartezeiten werden ausschließlich von den jeweiligen
                Freizeit- und Themenparks ermittelt und entweder über Infotafeln vor den
                Attraktionen oder über Infobildschirme im Park angezeigt.
              </p>
              <p className="mb-4">
                Der Betreiber dieser Webseite übernimmt keine Haftung oder Verantwortung für den
                Inhalt, die Richtigkeit, Aktualität oder Vollständigkeit der angezeigten
                Wartezeiten, Statistiken oder sonstiger Informationen. Alle Angaben erfolgen ohne
                Gewähr. Alle verwendeten Marken, Warenzeichen und Firmenbezeichnungen sind Eigentum
                der jeweiligen Rechteinhaber.
              </p>
              <p className="mb-4">
                Eine Haftung für die Richtigkeit, Vollständigkeit und Aktualität der
                Veröffentlichungen kann trotz sorgfältiger Prüfung durch die Redaktion vom
                Herausgeber nicht übernommen werden.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Externe Links
              </h2>
              <p className="mb-4">
                Die Webseite enthält sogenannte „externe Links" (Verlinkungen) zu anderen Webseiten,
                auf deren Inhalt der Anbieter dieser Webseite keinen Einfluss hat. Für diese fremden
                Inhalte übernimmt der Anbieter keine Haftung oder Gewähr.
              </p>
              <p className="mb-4">
                Für die Inhalte und Richtigkeit der bereitgestellten Informationen der verlinkten
                Webseiten ist ausschließlich der jeweilige Anbieter der verlinkten Webseite
                verantwortlich. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte
                erkennbar. Sollte der Anbieter von rechtswidrigen Inhalten auf den verlinkten
                Webseiten Kenntnis erlangen, wird der entsprechende Link umgehend entfernt.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Datenquellen
              </h2>
              <p className="mb-4">
                Die auf dieser Webseite angezeigten Wartezeiten werden von den folgenden Plattformen
                bereitgestellt. Wir bedanken uns herzlich für die Bereitstellung der Daten:
              </p>
              <ul className="mb-4 space-y-2">
                <li>
                  <a
                    href="https://themeparks.wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    ThemeParks.wiki
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://queue-times.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    Queue-Times.com
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://wartezeiten.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    Wartezeiten.app
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          }
          en={
            <div className="space-y-6 text-base leading-7">
              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
                Information according to § 5 TMG
              </h2>

              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
              </address>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Contact</h3>
              <p className="mb-4">
                Email:{' '}
                <ObfuscatedEmail
                  local="hello"
                  domain="park.fan"
                  displayText="hello [at] park.fan"
                />
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Editorially responsible</h3>
              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
              </address>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Consumer Dispute Resolution / Universal Arbitration Board
              </h2>
              <p className="mb-4">
                We are neither willing nor obligated to participate in dispute resolution
                proceedings before a consumer arbitration board.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Disclaimer
              </h2>
              <p className="mb-4">
                This website is not an official website of any of the theme and amusement parks
                listed here. The displayed wait times are determined exclusively by the respective
                theme or amusement park and are shown either via information boards in front of the
                attractions or via information screens in the park.
              </p>
              <p className="mb-4">
                The operator of this website assumes no liability or responsibility for the content,
                accuracy, timeliness or completeness of the displayed wait times, statistics or
                other information. All information is provided without warranty. All trademarks,
                trade names and company names used are the property of their respective owners.
              </p>
              <p className="mb-4">
                Despite careful review by the editorial team, the publisher cannot assume liability
                for the accuracy, completeness and timeliness of publications.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                External Links
              </h2>
              <p className="mb-4">
                The website contains so-called "external links" (links) to other websites, over
                whose content the provider of this website has no influence. The provider assumes no
                liability or warranty for these external contents.
              </p>
              <p className="mb-4">
                The respective provider of the linked website is solely responsible for the content
                and accuracy of the information provided. At the time of linking, no illegal content
                was apparent. Should the provider become aware of illegal content on the linked
                websites, the corresponding link will be removed immediately.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                Data Sources
              </h2>
              <p className="mb-4">
                The wait times displayed on this website are provided by the following platforms. We
                sincerely thank them for providing the data:
              </p>
              <ul className="mb-4 space-y-2">
                <li>
                  <a
                    href="https://themeparks.wiki"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    ThemeParks.wiki
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://queue-times.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    Queue-Times.com
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://wartezeiten.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
                  >
                    Wartezeiten.app
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          }
        />
      </div>
    </div>
  );
}
