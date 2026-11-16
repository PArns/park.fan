import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Braces,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Compass,
  FerrisWheel,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Link2,
  LockKeyhole,
  Map,
  Plane,
  Route,
  ShieldCheck,
  Timer,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { SITE_URL, isValidLocale } from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { buildAlternates, buildOpenGraphMetadata } from '@/lib/utils/metadata';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getNumberFormat } from '@/lib/utils/intl-format';
import { DATA_TERMS_ANCHOR } from '@/lib/agents/licensing';
import {
  API_KEY_ERRORS,
  API_KEY_HEADER,
  API_KEY_VERIFY_URL,
  API_OPENAPI_URL,
  API_PERMISSION_GROUPS,
  API_PERMISSION_GROUP_IDS,
  API_PERMISSIONS_URL,
  API_REFERENCE_URL,
  DEFAULT_KEY_REQUESTS_PER_HOUR,
  KEYLESS_CURL_EXAMPLE,
  KEYLESS_LIMITS,
  PARK_ROUTE,
  PERMISSION_ROUTES,
  apiKeyCurlExample,
  type ApiPermissionGroupId,
} from '@/lib/developers/permissions';
import {
  ATTRIBUTION_ANCHOR,
  DEVELOPERS_PATH,
  DEVELOPER_DASHBOARD_PATH,
} from '@/lib/developers/paths';
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
import { cn } from '@/lib/utils';

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

const MCP_URL = `${SITE_URL}/api/mcp`;
const FULL_PARK_ROUTE = '/v1/parks/{continent}/{country}/{city}/{park}';

/** The icon each permission group carries on the portal. */
const GROUP_ICONS: Record<ApiPermissionGroupId, LucideIcon> = {
  live: Timer,
  parks: Map,
  rides: FerrisWheel,
  stats: BarChart3,
  forecasts: CalendarClock,
  planner: Route,
  travel: Plane,
};

/** The four steps from account to key. */
const STEPS: ReadonlyArray<{ key: string; icon: LucideIcon }> = [
  { key: 'register', icon: UserPlus },
  { key: 'request', icon: ClipboardList },
  { key: 'review', icon: ShieldCheck },
  { key: 'pickup', icon: KeyRound },
];

/** The park a credit's example links to. */
const EXAMPLE_PARK_PATH = '/parks/europe/germany/rust/europa-park';

/** The properties of a valid credit, in the order the requirements list them. */
const ATTRIBUTION_SPEC = ['text', 'anchor', 'target', 'rel', 'place', 'style'] as const;

/** A credit as HTML: the line of text, then a plain link to `href`. */
function attributionHtml(text: string, href: string): string {
  return `<p>\n  ${text}\n  <a href="${href}">park.fan</a>\n</p>`;
}

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
  className,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  badge?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // `min-w-0` on both, or a grid cell grows to the width of its widest `curl` line on a phone.
    <Card className={cn('min-w-0 gap-3 py-5', className)}>
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

/** A list item with a tick or a cross. */
function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <li className="flex gap-2.5">
      <Icon
        className={cn('mt-0.5 size-4 shrink-0', ok ? 'text-emerald-500' : 'text-destructive')}
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}

/**
 * The developer portal: what is open without a key (the wait times) and what each permission of
 * a key opens, how a key is requested and picked up on the dashboard, which key the terms allow,
 * how the credit must look, and how to call the API. A tool page: compact head whose one action
 * leads to the dashboard.
 */
export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tPerm, tLanding, tNav] = await Promise.all([
    getTranslations({ locale, namespace: 'developers' }),
    getTranslations({ locale, namespace: 'developers.permissions' }),
    getTranslations({ locale, namespace: 'landing.developers' }),
    getTranslations({ locale, namespace: 'navigation' }),
  ]);
  const number = getNumberFormat(locale);
  const faq = t.raw('faq.items') as Array<{ question: string; answer: string }>;
  const termsHref = `/impressum#${DATA_TERMS_ANCHOR}`;

  return (
    <>
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
        action={{
          href: DEVELOPER_DASHBOARD_PATH,
          label: t('hero.action'),
          icon: LayoutDashboard,
          prefetch: false,
        }}
      />

      <div className="space-y-16 pt-8 pb-16 sm:space-y-24 sm:pt-12 sm:pb-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Lead>{t('intro')}</Lead>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ key, icon: Icon }, index) => (
              <li
                key={key}
                data-card
                className="border-border/70 bg-background/60 relative rounded-2xl border p-5 backdrop-blur"
              >
                <span className="text-primary/15 absolute top-3 right-4 text-4xl font-black tabular-nums">
                  {index + 1}
                </span>
                <Icon className="text-primary mb-3 size-6" aria-hidden />
                <p className="font-semibold">{t(`steps.${key}.title`)}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {t(`steps.${key}.text`)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <SectionShell
          id="access"
          index="01"
          kicker={t('access.kicker')}
          title={t('access.title')}
          icon={LockKeyhole}
        >
          <P>{t('access.lead')}</P>
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard
              icon={Timer}
              title={t('access.openTitle')}
              badge={<Badge variant="outline">{t('access.openBadge')}</Badge>}
            >
              <p className="text-muted-foreground leading-relaxed">
                {t('access.openBody', {
                  perMinute: number.format(KEYLESS_LIMITS.perMinute),
                  perHour: number.format(KEYLESS_LIMITS.perHour),
                })}
              </p>
              <CodeSample>{KEYLESS_CURL_EXAMPLE}</CodeSample>
            </InfoCard>
            <InfoCard
              icon={KeyRound}
              title={t('access.keyTitle')}
              badge={<Badge>{t('access.keyBadge')}</Badge>}
            >
              <p className="text-muted-foreground leading-relaxed">{t('access.keyBody')}</p>
              <CodeSample>{apiKeyCurlExample('pfk_…')}</CodeSample>
            </InfoCard>
          </div>
        </SectionShell>

        <SectionShell
          id="permissions"
          index="02"
          kicker={t('permissionsChapter.kicker')}
          title={t('permissionsChapter.title')}
          icon={ShieldCheck}
        >
          <P>{t('permissionsChapter.lead')}</P>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {API_PERMISSION_GROUP_IDS.map((group) => (
              <InfoCard key={group} icon={GROUP_ICONS[group]} title={tPerm(`groups.${group}`)}>
                <ul className="space-y-3">
                  {API_PERMISSION_GROUPS[group].map((permission) => (
                    <li key={permission} className="space-y-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {tPerm(`items.${permission}.title`)}
                        <code className={cn(INLINE_CODE_CLASS, 'text-xs')}>{permission}</code>
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {tPerm(`items.${permission}.description`)}
                      </p>
                      {PERMISSION_ROUTES[permission].length > 0 && (
                        <details className="text-xs">
                          <summary className="text-primary cursor-pointer">
                            {t('permissionsChapter.routes')}
                          </summary>
                          <ul className="mt-1.5 space-y-1">
                            {PERMISSION_ROUTES[permission].map((route) => (
                              <li key={route}>
                                <code className={INLINE_CODE_CLASS}>{route}</code>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            {t.rich('permissionsChapter.parkRoute', {
              code,
              short: PARK_ROUTE,
              full: FULL_PARK_ROUTE,
            })}
          </p>
          <p className="text-muted-foreground text-sm">
            {t.rich('permissionsChapter.catalog', { code, url: API_PERMISSIONS_URL })}
          </p>
        </SectionShell>

        <SectionShell
          id="keys"
          index="03"
          kicker={t('tiers.kicker')}
          title={t('tiers.title')}
          icon={BadgeCheck}
        >
          <P>{t('tiers.lead')}</P>
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard
              icon={BadgeCheck}
              title={t('tiers.freeTitle')}
              className="border-emerald-500/40"
            >
              <ul className="space-y-2 text-sm leading-relaxed">
                <Check ok>{t('tiers.free.openSource')}</Check>
                <Check ok>{t('tiers.free.noMoney')}</Check>
                <Check ok>{t('tiers.free.donations')}</Check>
                <Check ok>{t('tiers.free.backlink')}</Check>
              </ul>
            </InfoCard>
            <InfoCard
              icon={CircleDollarSign}
              title={t('tiers.paidTitle')}
              className="border-amber-500/40"
            >
              <p className="text-muted-foreground text-sm leading-relaxed">{t('tiers.paidBody')}</p>
              <ul className="space-y-2 text-sm leading-relaxed">
                <Check ok={false}>{t('tiers.paid.ads')}</Check>
                <Check ok={false}>{t('tiers.paid.affiliate')}</Check>
                <Check ok={false}>{t('tiers.paid.price')}</Check>
                <Check ok={false}>{t('tiers.paid.closed')}</Check>
              </ul>
            </InfoCard>
          </div>
          <P>{t('tiers.review')}</P>
        </SectionShell>

        <SectionShell
          id={ATTRIBUTION_ANCHOR}
          index="04"
          kicker={t('attribution.kicker')}
          title={t('attribution.title')}
          icon={Link2}
        >
          <P>{t('attribution.lead')}</P>
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard icon={CheckCircle2} title={t('attribution.doTitle')}>
              <ul className="space-y-2 text-sm leading-relaxed">
                {(['visible', 'link', 'follow', 'indexable', 'near', 'apps'] as const).map(
                  (key) => (
                    <Check key={key} ok>
                      {t.rich(`attribution.do.${key}`, { code })}
                    </Check>
                  )
                )}
              </ul>
            </InfoCard>
            <InfoCard icon={XCircle} title={t('attribution.dontTitle')}>
              <ul className="space-y-2 text-sm leading-relaxed">
                {(['nofollow', 'hidden', 'scriptOnly', 'redirect', 'image'] as const).map((key) => (
                  <Check key={key} ok={false}>
                    {t.rich(`attribution.dont.${key}`, { code })}
                  </Check>
                ))}
              </ul>
            </InfoCard>
          </div>
          <InfoCard icon={BadgeCheck} title={t('attribution.specTitle')}>
            <dl className="divide-border divide-y text-sm">
              {ATTRIBUTION_SPEC.map((key) => (
                <div key={key} className="grid gap-1 py-2.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <dt className="font-semibold">{t(`attribution.spec.${key}.label`)}</dt>
                  <dd className="text-muted-foreground leading-relaxed">
                    {t.rich(`attribution.spec.${key}.value`, { code })}
                  </dd>
                </div>
              ))}
            </dl>
          </InfoCard>
          <InfoCard icon={Braces} title={t('attribution.exampleTitle')}>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('attribution.exampleBody')}
            </p>
            <figure className="space-y-2">
              <figcaption className="text-muted-foreground text-xs font-medium">
                {t('attribution.previewTitle')}
              </figcaption>
              <p className="border-border bg-background/60 rounded-lg border border-dashed px-4 py-3 text-sm">
                {t('attribution.sampleText')}{' '}
                <a
                  href={`${SITE_URL}/${locale}${EXAMPLE_PARK_PATH}`}
                  className="text-primary underline underline-offset-2"
                >
                  park.fan
                </a>
              </p>
            </figure>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {t('attribution.parkVariant')}
                </p>
                <CodeSample>
                  {attributionHtml(
                    t('attribution.sampleText'),
                    `${SITE_URL}/${locale}${EXAMPLE_PARK_PATH}`
                  )}
                </CodeSample>
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-muted-foreground text-xs font-medium">
                  {t('attribution.footerVariant')}
                </p>
                <CodeSample>
                  {attributionHtml(t('attribution.sampleText'), `${SITE_URL}/`)}
                </CodeSample>
              </div>
            </div>
          </InfoCard>
        </SectionShell>

        <SectionShell
          id="usage"
          index="05"
          kicker={t('usage.kicker')}
          title={t('usage.title')}
          icon={Braces}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <InfoCard icon={KeyRound} title={t('usage.keyTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.keyBody', { code })}
              </p>
            </InfoCard>
            <InfoCard icon={ShieldCheck} title={t('usage.verifyTitle')}>
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
            <InfoCard icon={Timer} title={t('usage.limitsTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.limitsBody', {
                  code,
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
            <InfoCard icon={Compass} title={t('usage.mcpTitle')}>
              <p className="text-muted-foreground leading-relaxed">
                {t.rich('usage.mcpBody', { code, url: MCP_URL })}
              </p>
            </InfoCard>
          </div>
          <P>
            <A href={termsHref}>{t('usage.terms')}</A>
          </P>
        </SectionShell>

        <SectionShell
          id="faq"
          index="06"
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
            href: DEVELOPER_DASHBOARD_PATH,
            label: t('next.dashboard'),
            description: t('next.dashboardDescription'),
            icon: LayoutDashboard,
            prefetch: false,
          },
          {
            href: API_REFERENCE_URL,
            label: t('next.reference'),
            description: t('next.referenceDescription'),
            icon: BookOpen,
          },
        ]}
      />
    </>
  );
}
