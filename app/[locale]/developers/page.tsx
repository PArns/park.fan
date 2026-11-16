import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BookOpen,
  Braces,
  HelpCircle,
  KeyRound,
  LockKeyhole,
  Scale,
  Send,
  type LucideIcon,
} from 'lucide-react';
import { SITE_URL, isValidLocale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { RouteMessages } from '@/i18n/route-messages';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { DATA_TERMS_ANCHOR } from '@/lib/agents/licensing';
import {
  API_KEY_ERRORS,
  API_KEY_HEADER,
  API_KEY_VERIFY_URL,
  API_OPENAPI_URL,
  API_REFERENCE_URL,
  API_SCOPES,
  API_SCOPE_DEFINITIONS,
  DEFAULT_KEY_REQUESTS_PER_HOUR,
  KEYLESS_LIMITS,
  OPEN_API_ROUTES,
  PARK_ROUTE,
  apiKeyCurlExample,
} from '@/lib/developers/scopes';
import { DEVELOPERS_PATH, KEY_REQUEST_ANCHOR } from '@/lib/developers/paths';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';
import {
  A,
  FaqList,
  LandingHero,
  LandingNextSteps,
  Lead,
  P,
  SectionShell,
} from '@/components/marketing/editorial-ui';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CodeSample, INLINE_CODE_CLASS } from '@/components/common/code';
import { KeyRequestForm } from '@/components/developers/key-request-form';

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

const MCP_URL = `${SITE_URL}/api/mcp`;
const FULL_PARK_ROUTE = '/v1/parks/{continent}/{country}/{city}/{park}';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: DevelopersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'developers.meta' });
  return {
    title: t('title'),
    description: t('description'),
    ...buildOpenGraphMetadata({
      locale,
      title: t('title'),
      description: t('description'),
      url: `${SITE_URL}/${locale}${DEVELOPERS_PATH}`,
      ogImageUrl: getOgImageUrl([locale, 'developers']),
    }),
    alternates: buildAlternates(locale, () => DEVELOPERS_PATH),
  };
}

/** `<code>` inside a translated sentence. */
const code = (chunks: React.ReactNode) => <code className={INLINE_CODE_CLASS}>{chunks}</code>;

/** A card inside a chapter, with its `<h3>`. */
function InfoCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // `min-w-0` on both, or a grid cell grows to the width of its widest `curl` line on a phone.
    <Card className="min-w-0 gap-3 py-5">
      <CardContent className="min-w-0 space-y-3 px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            {Icon && <Icon className="text-primary size-5 shrink-0" aria-hidden />}
            {title}
          </h3>
          {badge}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

/** The routes a card covers, one per line, as paths on api.park.fan. */
function RouteList({ label, routes }: { label: string; routes: readonly string[] }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wide uppercase">
        {label}
      </p>
      <ul className="space-y-1 text-sm">
        {routes.map((route) => (
          <li key={route}>
            <code className={INLINE_CODE_CLASS}>{route}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The developer portal: what the API serves openly and what each key scope opens (from
 * `lib/developers/scopes.ts`), how to send and check a key, the terms in short, and the key
 * request form. A tool page: compact head whose one action is the form further down.
 */
export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tLanding, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'developers' }),
    getTranslations({ locale, namespace: 'landing.developers' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const number = getNumberFormat(locale);
  const faq = t.raw('faq.items') as Array<{ question: string; answer: string }>;
  const termsHref = `/impressum#${DATA_TERMS_ANCHOR}`;

  return (
    <RouteMessages route="/developers">
      <BreadcrumbStructuredData
        breadcrumbs={[{ name: tNav('home'), url: '/' }]}
        currentPage={{ name: t('hero.title'), url: DEVELOPERS_PATH }}
        locale={locale}
      />
      <LandingHero
        variant="compact"
        kicker={tLanding('kicker')}
        title={t('hero.title')}
        tagline={t('hero.tagline')}
        action={{ href: `#${KEY_REQUEST_ANCHOR}`, label: t('hero.action'), icon: KeyRound }}
      />

      <div className="space-y-16 pt-8 pb-16 sm:space-y-24 sm:pt-12 sm:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Lead>{t('intro')}</Lead>
          </div>
        </div>

        <SectionShell
          id="access"
          index="01"
          kicker={t('access.kicker')}
          title={t('access.title')}
          icon={LockKeyhole}
        >
          <P>{t('access.lead')}</P>
          <InfoCard title={t('access.openTitle')}>
            <p className="text-muted-foreground leading-relaxed">
              {t('access.openBody', {
                perMinute: number.format(KEYLESS_LIMITS.perMinute),
                perHour: number.format(KEYLESS_LIMITS.perHour),
              })}
            </p>
            <RouteList label={t('access.routes')} routes={OPEN_API_ROUTES} />
          </InfoCard>

          <h3 className="pt-4 text-xl font-semibold">{t('access.scopedTitle')}</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            {API_SCOPES.map((scope) => {
              const definition = API_SCOPE_DEFINITIONS[scope];
              return (
                <InfoCard
                  key={scope}
                  title={t(`scopes.${scope}.title`)}
                  badge={
                    <Badge variant={definition.enforced ? 'default' : 'outline'}>
                      {definition.enforced ? t('access.enforced') : t('access.upcoming')}
                    </Badge>
                  }
                >
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`scopes.${scope}.description`)}
                  </p>
                  {!definition.enforced && (
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t('access.upcomingHint')}
                    </p>
                  )}
                  <RouteList label={t('access.routes')} routes={definition.routes} />
                </InfoCard>
              );
            })}
          </div>
          <p className="text-muted-foreground text-sm">
            {t.rich('access.parkRoute', { code, short: PARK_ROUTE, full: FULL_PARK_ROUTE })}
          </p>
        </SectionShell>

        <SectionShell
          id="usage"
          index="02"
          kicker={t('usage.kicker')}
          title={t('usage.title')}
          icon={Braces}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard icon={KeyRound} title={t('usage.keyTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.keyBody', { code })}
              </p>
              <CodeSample>{apiKeyCurlExample('pfk_…')}</CodeSample>
            </InfoCard>
            <InfoCard icon={KeyRound} title={t('usage.verifyTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.verifyBody', { code })}
              </p>
              <CodeSample>{`curl -H "${API_KEY_HEADER}: pfk_…" ${API_KEY_VERIFY_URL}`}</CodeSample>
            </InfoCard>
          </div>

          <InfoCard title={t('usage.errorsTitle')}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground text-xs">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      {t('usage.errorStatus')}
                    </th>
                    <th scope="col" className="py-2 pr-4 font-semibold">
                      {t('usage.errorCode')}
                    </th>
                    <th scope="col" className="py-2 font-semibold">
                      {t('usage.errorMeaning')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border divide-y">
                  {API_KEY_ERRORS.map((error) => (
                    <tr key={error.code}>
                      <td className="py-2 pr-4 tabular-nums">{error.status}</td>
                      <td className="py-2 pr-4">
                        <code className={INLINE_CODE_CLASS}>{error.code}</code>
                      </td>
                      <td className="text-muted-foreground py-2">
                        {t(`usage.errors.${error.code}`)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </InfoCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard title={t('usage.limitsTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t('usage.limitsBody', {
                  perHour: number.format(DEFAULT_KEY_REQUESTS_PER_HOUR),
                })}
              </p>
            </InfoCard>
            <InfoCard icon={LockKeyhole} title={t('usage.secretTitle')}>
              <p className="text-muted-foreground leading-relaxed">{t('usage.secretBody')}</p>
            </InfoCard>
            <InfoCard icon={BookOpen} title={t('usage.referenceTitle')}>
              <p className="text-muted-foreground leading-relaxed">{t('usage.referenceBody')}</p>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href={API_REFERENCE_URL}
                    className="text-primary font-medium underline underline-offset-2"
                  >
                    {t('usage.referenceLink')}
                  </a>
                </li>
                <li>
                  <a
                    href={API_OPENAPI_URL}
                    className="text-primary font-medium underline underline-offset-2"
                  >
                    {t('usage.openapiLink')}
                  </a>
                </li>
              </ul>
            </InfoCard>
            <InfoCard title={t('usage.mcpTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.mcpBody', { code, url: MCP_URL })}
              </p>
            </InfoCard>
          </div>
        </SectionShell>

        <SectionShell
          id="terms"
          index="03"
          kicker={t('terms.kicker')}
          title={t('terms.title')}
          icon={Scale}
        >
          <ul className="text-muted-foreground max-w-3xl list-disc space-y-2 pl-5 leading-relaxed">
            {(['credit', 'nonCommercial', 'commercial', 'live', 'training', 'texts'] as const).map(
              (key) => (
                <li key={key}>{t(`terms.${key}`)}</li>
              )
            )}
          </ul>
          <P>
            <A href={termsHref}>{t('terms.full')}</A>
          </P>
        </SectionShell>

        <SectionShell
          id={KEY_REQUEST_ANCHOR}
          index="04"
          kicker={t('request.kicker')}
          title={t('request.title')}
          icon={Send}
        >
          <div className="max-w-3xl space-y-6">
            <P>{t('request.lead')}</P>
            <KeyRequestForm locale={locale} />
          </div>
        </SectionShell>

        <SectionShell
          id="faq"
          index="05"
          kicker={t('faq.kicker')}
          title={t('faq.title')}
          icon={HelpCircle}
        >
          <FaqList items={faq} />
        </SectionShell>
      </div>

      <LandingNextSteps
        title={t('next.title')}
        destinations={[
          {
            href: API_REFERENCE_URL,
            label: t('next.reference'),
            description: t('next.referenceDescription'),
            icon: BookOpen,
          },
          {
            href: termsHref,
            label: t('next.terms'),
            description: t('next.termsDescription'),
            icon: Scale,
          },
        ]}
      />
    </RouteMessages>
  );
}
