import { setRequestLocale } from 'next-intl/server';
import { RouteMessages } from '@/i18n/route-messages';
import { assertServableRoute } from '@/lib/utils/route-guards';
import { BrandPage, brandPageMetadata, type BrandPageProps } from '@/components/parks/brand-page';
import { UNIVERSAL } from '@/lib/parks/park-brands';

/** The Universal page's metadata, see `brandPageMetadata`. */
export function generateMetadata(props: BrandPageProps) {
  return brandPageMetadata(UNIVERSAL, props);
}

/** Every Universal park, for "universal wait times" and "universal studios wait times". */
export default async function UniversalPage({ params }: BrandPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);
  return (
    <RouteMessages route="/parks/universal">
      <BrandPage brand={UNIVERSAL} locale={locale} />
    </RouteMessages>
  );
}
