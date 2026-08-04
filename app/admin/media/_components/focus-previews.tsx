'use client';

import { useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { BlogPostCardView } from '@/components/blog/blog-post-card-view';
import { AttractionCard } from '@/components/parks/attraction-card';
import { ParkBackground } from '@/components/parks/park-background';
import { ParkCard } from '@/components/parks/park-card';
import { cn } from '@/lib/utils';
import messages from '@/messages/de.json';
import type { ParkAttraction } from '@/lib/api/types';

/**
 * The focal-point previews: the photo inside the **real** components the site
 * paints it with, in the states it actually renders in.
 *
 * Two reasons these are not plain aspect-ratio boxes. Framing cannot be judged in
 * isolation — a ride card lays a glass header over the top ~50px and a wait panel
 * over the bottom, so "the subject is centred" and "the subject is visible" are
 * different questions, and how much chrome there is depends on the state: a second
 * badge row pushes the photo down, a short footer gives it back. And `CardPhoto`
 * draws a mirrored reflection anchored to that header seam, which without a header
 * renders as a kaleidoscope — the exact artefact a look-alike box produced.
 *
 * The cards need next-intl and the admin lives outside `[locale]` with no provider,
 * so one is supplied here — the same trick as
 * `blog-editor/_extensions/inline-badge.tsx`, with the full message bundle because
 * these are whole cards rather than a single badge.
 */

const PARK_PATH = '/parks/europe/netherlands/sevenum/toverland';
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

/**
 * The blog tab renders `BlogPostCardView` rather than `BlogPostCard`: the wrapper
 * resolves its author and category through modules that read the filesystem, which
 * cannot be part of a client bundle. The view is the same markup with those two
 * strings passed in — worth the split, because blog covers are the one surface that
 * crops from the CENTRE while park and ride cards crop from the top, so their
 * framing genuinely cannot be judged from the others.
 */

interface Props {
  /** The image being edited. */
  src: string;
  /** Live `object-position` from the editor — not yet saved to the sidecar. */
  objectPosition: string;
}

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
              author="Patrick Arns"
              categoryLabel="Guides"
            />
            <BlogPostCardView
              post={blogFixture(
                src,
                'Ein deutlich längerer Titel, der über zwei Zeilen läuft und den Ausschnitt verschiebt'
              )}
              author="Patrick Arns"
              categoryLabel="Hinter den Kulissen"
            />
          </PreviewGrid>
        )}

        {tab === 'background' && (
          <div>
            <Hint>park page &amp; hero — the most aggressive crop, with page content over it</Hint>
            <div className="border-border relative aspect-[16/10] w-full overflow-hidden rounded-lg border">
              <ParkBackground imageSrc={src} alt="" objectPosition={objectPosition} />
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

// ─── fixtures ────────────────────────────────────────────────────────────────

/**
 * A ride shaped like the API's, dialled to the chrome that changes the crop.
 *
 * `twoBadgeRows` adds the badges that wrap the row (crowd level, rope drop, height,
 * wetness); `tallFooter` adds the trend, statistics and best-time lines under the
 * wait panel.
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
    status: closed ? 'CLOSED' : 'OPERATING',
    effectiveStatus: closed ? 'CLOSED' : 'OPERATING',
    queues: [
      {
        queueType: 'STANDBY',
        waitTime: closed ? null : 75,
        status: closed ? 'CLOSED' : 'OPERATING',
        lastUpdated: STAMP,
      },
    ],
    ...(twoBadgeRows
      ? {
          crowdLevel: 'very_high',
          minimumHeight: 130,
          minimumHeightUnit: 'cm',
          mayGetWet: true,
          ropeDrop: { recommended: true },
        }
      : {}),
    ...(tallFooter && !closed
      ? {
          trend: 'falling',
          statistics: { avgWaitToday: 75, peakWaitToday: 120, timestamp: STAMP },
          bestVisitTimes: { bestTime: '18:45' },
        }
      : {}),
  } as unknown as ParkAttraction;
}

/** The minimum a blog card reads — frontmatter, slug and reading time. */
function blogFixture(cover: string, title: string) {
  return {
    slug: 'preview-post',
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
  } as unknown as Parameters<typeof BlogPostCardView>[0]['post'];
}

// ─── chrome ──────────────────────────────────────────────────────────────────

function PreviewGrid({ hint, children }: { hint: string; children: React.ReactNode }) {
  return (
    <div>
      <Hint>{hint}</Hint>
      <div className="grid grid-cols-2 gap-3">{children}</div>
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
