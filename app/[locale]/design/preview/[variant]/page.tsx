import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { assertServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { HomepageDraft } from '../../_variants/homepage-draft';
import { loadDesignData } from '../../_variants/data';
import { displayFont, numericFont } from '../../_variants/fonts';
import type { Locale } from '@/i18n/config';

const VARIANTS = ['horizon'] as const;

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Startseite — Entwurf',
};

/**
 * Der Entwurf allein, im echten Seitenrahmen.
 *
 * `/design` bettet das in einen 390 px breiten iframe, damit die Handy-Fassung neben der
 * Desktop-Fassung beurteilt werden kann. Dafür braucht es eine echte Route und keinen schmalen
 * `<div>`: Tailwinds `sm:`/`lg:` sind Viewport-Media-Queries, ein 390-px-Kasten auf einem
 * 1440-px-Schirm rendert also trotzdem jede Desktop-Regel. Ein iframe hat einen eigenen Viewport.
 */
export default async function DesignPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; variant: string }>;
}) {
  const { locale, variant } = await params;
  assertServableRoute(locale);
  if (!VARIANTS.includes(variant as (typeof VARIANTS)[number])) notFound();
  setRequestLocale(locale);

  const data = await loadDesignData(locale as Locale);

  return (
    <RouteMessages route="/design/preview/[variant]">
      <div className={`${displayFont.variable} ${numericFont.variable}`}>
        <HomepageDraft locale={locale as Locale} {...data} />
      </div>
    </RouteMessages>
  );
}

export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}
