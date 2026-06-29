import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import type { GlossaryTerm } from '@/lib/glossary/types';

const WIDTH = 1200;
const HEIGHT = 630;
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://park.fan';
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
  const kicker = `park.fan · ${t('termTitleSuffix')}`;
  const subtitle = term.shortDefinition || term.definition.split('\n\n')[0] || '';
  const title = term.name;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        backgroundColor: '#0f172a',
        color: 'white',
        fontFamily: '"Inter"',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Brand glow + vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 80% 20%, ${GLOW}, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.92) 100%)',
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          height: '100%',
          width: '100%',
        }}
      >
        {/* Kicker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: KICKER,
          }}
        >
          <span
            style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, background: KICKER }}
          />
          {clamp(kicker, 60)}
        </div>

        {/* Title + short definition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 30 ? 72 : 92,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1050,
              color: '#ffffff',
            }}
          >
            {clamp(title, 80)}
          </div>
          {subtitle && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 400,
                lineHeight: 1.35,
                maxWidth: 1000,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              {clamp(subtitle, 180)}
            </div>
          )}
        </div>

        {/* Brand bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: -1,
            }}
          >
            <span style={{ color: '#ffffff' }}>park</span>
            <span style={{ color: KICKER }}>.fan</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 22,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            {SITE_URL.replace(/^https?:\/\//, '')}
          </div>
        </div>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}

function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + '…';
}
