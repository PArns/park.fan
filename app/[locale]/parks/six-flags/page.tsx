import { setRequestLocale } from 'next-intl/server';
import { RouteMessages } from '@/i18n/route-messages';
import { assertServableRoute } from '@/lib/utils/route-guards';
import { BrandPage, brandPageMetadata, type BrandPageProps } from '@/components/parks/brand-page';
import { SIX_FLAGS } from '@/lib/parks/park-brands';

/** The Six Flags page's metadata, see `brandPageMetadata`. */
export function generateMetadata(props: BrandPageProps) {
  return brandPageMetadata(SIX_FLAGS, props);
}

/** Every Six Flags and Hurricane Harbor park, for "six flags wait times". */
export default async function SixFlagsPage({ params }: BrandPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);
  return (
    <RouteMessages route="/parks/six-flags">
      <BrandPage brand={SIX_FLAGS} locale={locale} />
    </RouteMessages>
  );
}
