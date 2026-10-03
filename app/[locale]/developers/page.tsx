import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ExternalLink } from 'lucide-react';
import {
  locales,
  generateAlternateLanguages,
  localeToOpenGraphLocale,
  SITE_URL,
} from '@/i18n/config';
import { routing } from '@/i18n/routing';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { Card } from '@/components/ui/card';
import { API_CATALOG_PATH } from '@/lib/agents/api-catalog';
import { AI_CATALOG_PATH } from '@/lib/agents/catalog';
import { AGENT_SKILLS_INDEX_PATH } from '@/lib/agents/skills';
import { MCP_ENDPOINT_PATH, MCP_SERVER_CARD_PATH } from '@/lib/agents/mcp-server-card';
import { RSL_LICENSE_PATH } from '@/lib/agents/licensing';
import { TOOL_DESCRIPTORS } from '@/lib/agents/tool-descriptors';
import { BreadcrumbStructuredData } from '@/components/seo/structured-data';

/**
 * `/developers`: the human-readable front door to what `lib/agents/` serves to machines.
 *
 * Every URL below comes from the module that serves it, never typed here: this page exists so a
 * person can find these documents, and a link that drifts from the document it names is the
 * failure `pnpm check:agent-ready` guards on the machine side. Only the copy is translated.
 * The targets are route handlers and other origins, so they are plain `<a>`, not the i18n
 * `Link` (a client-side navigation to a route handler fetches an RSC payload that does not
 * exist). Nothing here is fetched: no API call, no client component, no `RouteMessages`.
 */

interface DevelopersPageProps {
  params: Promise<{ locale: string }>;
}

const API_ORIGIN = 'https://api.park.fan';

type DocItem = { key: string; href: string };

const API_ITEMS: DocItem[] = [
  { key: 'reference', href: `${API_ORIGIN}/api` },
  { key: 'openapi', href: `${API_ORIGIN}/api-json` },
  { key: 'catalog', href: API_CATALOG_PATH },
];

const AGENT_ITEMS: DocItem[] = [
  { key: 'llms', href: '/llms.txt' },
  { key: 'skills', href: AGENT_SKILLS_INDEX_PATH },
  { key: 'aiCatalog', href: AI_CATALOG_PATH },
  { key: 'serverCard', href: MCP_SERVER_CARD_PATH },
  { key: 'license', href: RSL_LICENSE_PATH },
];

/** Tool names come from the descriptors the MCP server itself answers with; only the note is copy. */
const TOOL_NOTE_KEYS: Record<string, string> = {
  search_theme_parks: 'search',
  get_park_wait_times: 'waitTimes',
  get_park_best_days: 'bestDays',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: DevelopersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'developers.meta' });
  const ogImageUrl = getOgImageUrl([locale, 'developers']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `${SITE_URL}/${locale}/developers`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/developers`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/developers`),
        'x-default': `${SITE_URL}/en/developers`,
      },
    },
  };
}

function DocLinks({
  items,
  group,
  t,
}: {
  items: DocItem[];
  group: 'api' | 'agents';
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const external = item.href.startsWith('http');
        return (
          <li key={item.key}>
            <Card className="hover:border-primary/40 h-full gap-1 py-4 transition-colors">
              <a
                href={item.href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="flex h-full flex-col gap-1 px-5"
              >
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {t(`${group}.items.${item.key}.label`)}
                  {external && <ExternalLink className="size-3.5" aria-hidden="true" />}
                </span>
                <span className="text-muted-foreground font-mono text-xs break-all">
                  {item.href.startsWith('http') ? item.href.replace('https://', '') : item.href}
                </span>
                <span className="text-muted-foreground text-sm">
                  {t(`${group}.items.${item.key}.note`)}
                </span>
              </a>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}

export default async function DevelopersPage({ params }: DevelopersPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'developers' });
  const tFooter = await getTranslations({ locale, namespace: 'footer' });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      {/* The page had no structured data at all (SEO run, 2026-10-03). The same two-step trail
          Fancast emits, named the way the footer links the page. */}
      <BreadcrumbStructuredData
        breadcrumbs={[
          { name: 'park.fan', url: '/' },
          { name: tFooter('developers'), url: '/developers' },
        ]}
        locale={locale}
      />
      <header className="mb-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{t('hero.title')}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base sm:text-lg">
          {t('hero.lead')}
        </p>
      </header>

      <section className="mb-10" aria-labelledby="developers-api">
        <h2 id="developers-api" className="mb-2 text-xl font-semibold">
          {t('api.heading')}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-2xl">{t('api.body')}</p>
        <DocLinks items={API_ITEMS} group="api" t={t} />
      </section>

      <section className="mb-10" aria-labelledby="developers-agents">
        <h2 id="developers-agents" className="mb-2 text-xl font-semibold">
          {t('agents.heading')}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-2xl">{t('agents.body')}</p>
        <DocLinks items={AGENT_ITEMS} group="agents" t={t} />
      </section>

      <section className="mb-10" aria-labelledby="developers-mcp">
        <h2 id="developers-mcp" className="mb-2 text-xl font-semibold">
          {t('mcp.heading')}
        </h2>
        <p className="text-muted-foreground mb-4 max-w-2xl">
          {t('mcp.body')}{' '}
          <code className="font-mono text-sm">
            {SITE_URL}
            {MCP_ENDPOINT_PATH}
          </code>
        </p>
        <dl className="grid gap-3">
          {TOOL_DESCRIPTORS.map((tool) => {
            const noteKey = TOOL_NOTE_KEYS[tool.name];
            // A fourth tool without copy fails the build instead of printing a missing key.
            if (!noteKey) throw new Error(`developers page: no note for MCP tool ${tool.name}`);
            return (
              <Card key={tool.name} className="gap-1 px-5 py-4">
                <dt className="font-mono text-sm font-semibold">{tool.name}</dt>
                <dd className="text-muted-foreground text-sm">{t(`mcp.tools.${noteKey}`)}</dd>
              </Card>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="developers-terms">
        <h2 id="developers-terms" className="mb-2 text-xl font-semibold">
          {t('terms.heading')}
        </h2>
        <ul className="text-muted-foreground list-disc space-y-2 pl-5">
          <li>{t('terms.noKey')}</li>
          <li>{t('terms.markdown')}</li>
          <li>{t('terms.training')}</li>
          <li>{t('terms.credit')}</li>
          <li>{t('terms.admin')}</li>
        </ul>
      </section>
    </div>
  );
}
