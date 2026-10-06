'use client';

import { Children, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { BlogPostCardView } from '@/components/blog/blog-post-card-view';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkBackground } from '@/components/parks/park-background';
import { ParkCard } from '@/components/parks/park-card';
import { cn } from '@/lib/utils';
import messages from '@/messages/de.json';
import type { ParkAttraction } from '@/lib/api/types';
import type { BlogListItem } from '@/lib/blog/types';

/**
 * The focal-point previews: the photo inside the real components the site paints it with, in the
 * states it renders in, because the chrome laid over a photo decides what is visible. The admin has
 * no next-intl provider, so one is supplied here. The blog tab uses `BlogPostCardView`, since
 * `BlogPostCard` reads the filesystem; blog covers crop from the centre, the cards from the top.
 */

const PARK_PATH = '/parks/europe/netherlands/sevenum/attractiepark-toverland';
/** Fixed so the preview cards don't re-render with a new timestamp on every click. */
const STAMP = '2026-01-01T12:00:00.000Z';

const LOREM =
  'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.';

type Tab = 'ride' | 'park' | 'blog' | 'background';

const TABS: { id: Tab; label: string }[] = [
  { id: 'ride', label: 'Ride card' },
  { id: 'park', label: 'Park card' },
  { id: 'blog', label: 'Blog card' },
  { id: 'background', label: 'Background' },
];

interface Props {
  /** The image being edited. */
  src: string;
  /** Live `object-position` from the editor — not yet saved to the sidecar. */
  objectPosition: string;
}

/**
 * Tabbed previews of an image at the editor's live `object-position` inside the real ride card,
 * park card, blog card and park background, open and closed, with badge-row and footer toggles.
 */
export function FocusPreviews({ src, objectPosition }: Props) {
  const [tab, setTab] = useState<Tab>('ride');
  /** Badge row: one line, or wrapped to two — it shifts the photo down. */
  const [twoBadgeRows, setTwoBadgeRows] = useState(true);
  /** Footer: the wait panel with or without its best-time / rope-drop lines. */
  const [tallFooter, setTallFooter] = useState(true);

  const hasStateToggles = tab === 'ride' || tab === 'park';

  return (
    <NextIntlClientProvider locale="de" messages={messages} timeZone="Europe/Berlin">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="border-border flex rounded-md border p-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'rounded px-2 py-0.5 text-[11px] transition-colors',
                  tab === t.id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {hasStateToggles && (
            <>
              <Toggle active={twoBadgeRows} onClick={() => setTwoBadgeRows((v) => !v)}>
                {twoBadgeRows ? '2 badge rows' : '1 badge row'}
              </Toggle>
              <Toggle active={tallFooter} onClick={() => setTallFooter((v) => !v)}>
                {tallFooter ? 'tall footer' : 'short footer'}
              </Toggle>
            </>
          )}
        </div>

        {tab === 'ride' && (
          <PreviewGrid hint="park & ride grids — open, and closed (desaturated, no wait panel)">
            <AttractionCard
              attraction={rideFixture({ twoBadgeRows, tallFooter })}
              parkPath={PARK_PATH}
              backgroundImage={src}
              objectPosition={objectPosition}
            />
            <AttractionCard
              attraction={rideFixture({ twoBadgeRows, tallFooter, closed: true })}
              parkPath={PARK_PATH}
              backgroundImage={src}
              objectPosition={objectPosition}
            />
          </PreviewGrid>
        )}

        {tab === 'park' && (
          <PreviewGrid hint="hub pages, nearby, favorites">
            <ParkCard
              name="Lorem Ipsum Park"
              slug="preview-park"
              city="Sevenum"
              country="Netherlands"
              href={PARK_PATH}
              status="OPERATING"
              crowdLevel={twoBadgeRows ? 'very_high' : undefined}
              averageWaitTime={tallFooter ? 18 : undefined}
              operatingAttractions={tallFooter ? 22 : undefined}
              totalAttractions={tallFooter ? 30 : undefined}
              backgroundImage={src}
              objectPosition={objectPosition}
            />
            <ParkCard
              name="Geschlossener Zustand"
              slug="preview-park-closed"
              city="Sevenum"
              country="Netherlands"
              href={PARK_PATH}
              status="CLOSED"
              operatingAttractions={0}
              totalAttractions={30}
              backgroundImage={src}
              objectPosition={objectPosition}
            />
          </PreviewGrid>
        )}

        {tab === 'blog' && (
          <PreviewGrid hint="blog listing — crops from the CENTRE, unlike the park and ride cards">
            <BlogPostCardView
              post={blogFixture(src, 'Ein kurzer Titel')}
              cover={src}
              coverPosition={objectPosition}
              author="Patrick Arns"
              categoryLabel="Guides"
            />
            <BlogPostCardView
              post={blogFixture(
                src,
                'Ein deutlich längerer Titel, der über zwei Zeilen läuft und den Ausschnitt verschiebt'
              )}
              cover={src}
              coverPosition={objectPosition}
              author="Patrick Arns"
              categoryLabel="Hinter den Kulissen"
            />
          </PreviewGrid>
        )}

        {tab === 'background' && (
          <div>
            <Hint>park page &amp; hero — the most aggressive crop, with page content over it</Hint>
            <div className="border-border relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
              <ParkBackground imageSrc={src} alt="" objectPosition={objectPosition} contained />
              {/* Representative page content, so it is visible which part of the photo
                  ends up behind text and which part actually reaches the reader. */}
              <div className="relative z-10 p-4">
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase opacity-70">
                  Sevenum · Niederlande
                </p>
                <h4 className="mt-1 text-xl font-bold">Lorem Ipsum Park</h4>
                <p className="mt-2 max-w-md text-xs opacity-80">{LOREM}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Geöffnet', 'Ø 18 Min.', '22 / 30 offen'].map((chip) => (
                    <span
                      key={chip}
                      className="bg-background/70 rounded-full px-2 py-0.5 text-[10px] backdrop-blur-sm"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NextIntlClientProvider>
  );
}

/**
 * A ride shaped like the API's, dialled to the chrome that changes the crop. Typed as
 * `ParkAttraction` with no cast, so the compiler catches a field of the wrong shape, and without
 * `history`, so the card skips the sparkline instead of drawing a made-up curve.
 */
function rideFixture({
  twoBadgeRows,
  tallFooter,
  closed = false,
}: {
  twoBadgeRows: boolean;
  tallFooter: boolean;
  closed?: boolean;
}): ParkAttraction {
  return {
    id: 'preview',
    name: closed ? 'Geschlossener Zustand' : 'Chiapas - DIE Wasserbahn',
    slug: 'preview-ride',
    url: `${PARK_PATH}/preview-ride`,
    latitude: null,
    longitude: null,
    land: null,
    status: closed ? 'CLOSED' : 'OPERATING',
    queues: [
      {
        queueType: 'STANDBY',
        waitTime: closed ? null : 75,
        status: closed ? 'CLOSED' : 'OPERATING',
        lastUpdated: STAMP,
      },
    ],
    ...(twoBadgeRows
      ? { crowdLevel: 'very_high' as const, minimumHeight: 130, mayGetWet: true }
      : {}),
    ...(tallFooter && !closed
      ? {
          trend: 'falling' as const,
          statistics: {
            avgWaitToday: 75,
            minWaitToday: 30,
            maxWaitToday: 120,
            peakWaitToday: 120,
            peakWaitTimestamp: STAMP,
          },
        }
      : {}),
  };
}

/** The minimum a blog card reads. Typed, for the same reason `rideFixture` is. */
function blogFixture(cover: string, title: string): BlogListItem {
  return {
    slug: 'preview-post',
    translationKey: 'preview-post',
    loadedLocale: 'de',
    isFallback: false,
    readingTimeMinutes: 20,
    frontmatter: {
      title,
      excerpt: LOREM,
      date: '2026-07-24',
      author: 'patrick',
      category: 'guides',
      coverImage: { src: cover, alt: '' },
    },
  };
}

/**
 * The real card grid, not a lookalike: the cards' `row-span-3` subgrid (as in `land-section.tsx`)
 * sizes the photo track, and one shared grid reserves a closed ride's missing wait panel the way
 * the page does. The photo track is pinned to 220 px, the card as the three-column grid renders
 * it; `1fr` in a two-card preview grows taller than wide, and the focal point stops doing anything.
 */
function PreviewGrid({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <div>
      <Hint>{hint}</Hint>
      <div className="grid grid-cols-2 [grid-template-rows:auto_220px_auto] items-start gap-4">
        {Children.map(children, (child, i) => (
          <div key={i} className="row-span-3 grid max-w-[380px] [grid-template-rows:subgrid]">
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-1.5 text-[11px]">{children}</p>;
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
        active
          ? 'border-foreground text-foreground'
          : 'border-border text-muted-foreground hover:border-foreground'
      )}
    >
      {children}
    </button>
  );
}
