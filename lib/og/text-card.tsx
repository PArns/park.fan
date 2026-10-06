import { ImageResponse } from 'next/og';
import { ogAsJpeg } from '@/lib/og/jpeg';
import { OgBrandLockup } from '@/lib/og/brand-mark';

const WIDTH = 1200;
const HEIGHT = 630;

// 30 days, as the park and geo cards. Everything a text card shows ships with the deployment
// (post frontmatter, glossary data, translations), so it cannot change before the next deploy,
// and a deploy purges the CDN anyway.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400',
};

/** What one text card shows, and the sizes its kind of page sets it in. */
interface OgTextCard {
  /** The section label; an empty one leaves its row blank. Cut to `limit` characters. */
  kicker: { text: string; limit?: number };
  title: { text: string; fontSize: number; limit: number };
  subtitle: { text: string; fontSize: number; maxWidth: number };
  /** The kicker's colour and the glow in the top right corner. */
  colors: { kicker: string; glow: string };
  /** A photo under the gradient, when the page has one. */
  coverImage?: string | null;
  /** Lays the title and subtitle out as flex boxes. */
  flexText?: boolean;
}

/** Renders the text OG card of the blog and glossary pages: kicker, title and subtitle over a tinted gradient, with the brand lockup. */
export function renderOgTextCard({
  kicker,
  title,
  subtitle,
  colors,
  coverImage,
  flexText = false,
}: OgTextCard): Promise<Response> {
  const textDisplay = flexText ? { display: 'flex' as const } : {};

  return ogAsJpeg(
    new ImageResponse(
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
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt=""
            // Explicit intrinsic size: without it Satori has to derive the dimensions from the
            // image before it can lay out, which is what throws "Image size cannot be determined"
            // whenever the source can't be read.
            width={WIDTH}
            height={HEIGHT}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.45,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 80% 20%, ${colors.glow}, transparent 60%)`,
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
          {/* Without a kicker an empty row keeps the card's three-row rhythm. */}
          {kicker.text ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                color: colors.kicker,
              }}
            >
              <span
                style={{
                  display: 'flex',
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: colors.kicker,
                }}
              />
              {clamp(kicker.text, kicker.limit ?? Infinity)}
            </div>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                ...textDisplay,
                fontSize: title.fontSize,
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                maxWidth: 1050,
                color: '#ffffff',
              }}
            >
              {clamp(title.text, title.limit)}
            </div>
            {subtitle.text && (
              <div
                style={{
                  ...textDisplay,
                  fontSize: subtitle.fontSize,
                  fontWeight: 400,
                  lineHeight: 1.35,
                  maxWidth: subtitle.maxWidth,
                  color: 'rgba(255,255,255,0.82)',
                }}
              >
                {clamp(subtitle.text, 180)}
              </div>
            )}
          </div>

          <OgBrandLockup markerHeight={46} />
        </div>
      </div>,
      { width: WIDTH, height: HEIGHT, headers: CACHE_HEADERS }
    )
  );
}

function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit - 1).trimEnd() + '…';
}
