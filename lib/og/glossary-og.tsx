import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { renderOgTextCard } from '@/lib/og/text-card';
import type { GlossaryTerm } from '@/lib/glossary/types';

const KICKER = '#38bdf8';
const GLOW = 'rgba(56,189,248,0.35)';

interface GlossaryOgParams {
  locale: Locale;
  term: GlossaryTerm;
}

/**
 * Dynamic OG image for a single glossary term:
 *
 *   /api/og/<locale>/<glossarySegment>/<termSlug>
 *
 * Shows the term's own name + short definition with a glossary kicker — a
 * dedicated card, distinct from the generic site template (which would print
 * the overview title "Theme Park Dictionary", a search pill and an open/closed
 * status that make no sense for a dictionary entry).
 */
export async function renderGlossaryTermOg({ locale, term }: GlossaryOgParams): Promise<Response> {
  const t = await getTranslations({ locale, namespace: 'glossary' });
  // Section label only — the brand wordmark lives once in the bottom lockup,
  // so the kicker must not repeat "park.fan".
  const kicker = t('termTitleSuffix');
  const subtitle = term.shortDefinition || term.definition.split('\n\n')[0] || '';
  const title = term.name;

  return renderOgTextCard({
    kicker: { text: kicker, limit: 60 },
    title: { text: title, fontSize: title.length > 30 ? 72 : 92, limit: 80 },
    subtitle: { text: subtitle, fontSize: 28, maxWidth: 1000 },
    colors: { kicker: KICKER, glow: GLOW },
    flexText: true,
  });
}
