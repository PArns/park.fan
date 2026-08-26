import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment (`/de/glossar/looping`) and are
// served by a next.config rewrite, so the i18n <Link> would prefix the locale a
// second time. Plain next/link it is — but with prefetch off, matching the
// app-wide default in i18n/no-prefetch-link.
import Link from 'next/link';
import {
  Wrench,
  CalendarDays,
  RefreshCcw,
  Boxes,
  Gauge,
  MoveVertical,
  MoveHorizontal,
  Timer,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Speed, TrackLength } from '@/components/common/unit-display';
import { formatDuration } from '@/lib/utils/temperature';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/common/glass-card';
import { PageSection } from '@/components/common/page-section';
import { RideLayoutRail } from '@/components/parks/ride-layout-rail';
import { resolveRideProfile, rideProfileRenders } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileSectionProps {
  profile: RideProfile;
  locale: Locale;
}

/**
 * One labelled fact in the profile grid.
 *
 * Extracted when the grid grew past the three curated facts: the same `dt`/`dd`
 * pair repeated for every measurement is a place for one of them to drift.
 * `numeric` turns on tabular figures so a column of measurements lines up.
 */
function Fact({
  icon: Icon,
  label,
  numeric = false,
  children,
}: {
  icon: LucideIcon;
  label: string;
  numeric?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className={cn('text-sm font-semibold', numeric && 'tabular-nums')}>{children}</dd>
    </div>
  );
}

/**
 * The ride → glossary half of the link: what this ride is and what it does.
 *
 * Reads top-down the way the ride is built — who made it and when, what kind of
 * thing it is, then the layout itself as a rail you can step through in 3-D.
 * The facts used to sit at the BOTTOM, which read as a footnote; they are the
 * frame around the ride, not an afterthought.
 *
 * Term resolution is delegated to `resolveRideProfile` so this section and the
 * header teaser can never disagree about how many figures a ride has.
 */
export async function RideProfileSection({ profile, locale }: RideProfileSectionProps) {
  const t = await getTranslations('attraction.rideProfile');
  const tGlossary = await getTranslations('glossary');
  const { elements, types, manufacturerHref } = await resolveRideProfile(profile, locale);

  const stats = profile.stats ?? null;
  // Whether the facts grid has anything to draw. The question of whether the CHAPTER renders at
  // all is the same predicate the chapter row asks — one definition, in
  // `lib/glossary/ride-profile.ts`, so the two cannot disagree about whether this anchor exists.
  const hasFacts =
    Boolean(profile.manufacturer) ||
    profile.openedYear != null ||
    profile.inversions != null ||
    stats !== null;

  if (!(await rideProfileRenders(profile, locale))) return null;

  // The same nine keys the glossary term page builds for its own player.
  const playerLabels = {
    play: tGlossary('player.play'),
    pause: tGlossary('player.pause'),
    replay: tGlossary('player.replay'),
    view: tGlossary('player.view'),
    viewFront: tGlossary('player.viewFront'),
    viewFollow: tGlossary('player.viewFollow'),
    viewOnboard: tGlossary('player.viewOnboard'),
    loading: tGlossary('player.loading'),
    keys: tGlossary.raw('player.keys') as Record<string, string>,
  };

  return (
    /* One chapter like the others (same top rhythm, same gap under the title),
       frosted because the heading sits directly on the ride's hero photo. The
       id is the anchor the header teaser's "9 figures" jumps to. */
    <PageSection icon={Boxes} title={t('title')} frosted id="ride-profile">
      {/* `strong` rather than the default `medium`: this card sits over the
          attraction's hero photo, and /60 is not reliably readable over the
          bright parts of an arbitrary image. */}
      <GlassCard variant="strong" className="space-y-6 p-5 sm:p-6">
        {hasFacts && (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {profile.manufacturer && (
              <Fact icon={Wrench} label={t('manufacturer')}>
                {manufacturerHref ? (
                  <Link
                    href={manufacturerHref}
                    prefetch={false}
                    className="hover:text-primary transition-colors"
                  >
                    {profile.manufacturer}
                  </Link>
                ) : (
                  profile.manufacturer
                )}
                {profile.model && (
                  <span className="text-muted-foreground block text-xs font-normal">
                    {profile.model}
                  </span>
                )}
              </Fact>
            )}

            {profile.openedYear != null && (
              <Fact icon={CalendarDays} label={t('opened')} numeric>
                {profile.openedYear}
              </Fact>
            )}

            {profile.inversions != null && (
              <Fact icon={RefreshCcw} label={t('inversions')} numeric>
                {profile.inversions}
              </Fact>
            )}

            {/* Measurements from Wikidata. Each is independently nullable —
                Wikidata states what somebody entered, which for most rides is
                nothing — so each renders only when it has a number. */}
            {stats?.topSpeedKmh != null && (
              <Fact icon={Gauge} label={t('topSpeed')} numeric>
                <Speed kmh={stats.topSpeedKmh} />
              </Fact>
            )}
            {stats?.heightM != null && (
              <Fact icon={MoveVertical} label={t('height')} numeric>
                <TrackLength meters={stats.heightM} />
              </Fact>
            )}
            {stats?.lengthM != null && (
              <Fact icon={MoveHorizontal} label={t('length')} numeric>
                <TrackLength meters={stats.lengthM} />
              </Fact>
            )}
            {stats?.durationSeconds != null && (
              <Fact icon={Timer} label={t('duration')} numeric>
                {formatDuration(stats.durationSeconds)}
              </Fact>
            )}
          </dl>
        )}

        {/* Whose numbers these are. The API resolves this — `attribution` is
            null exactly when every surviving number is hand-curated and nobody
            outside is owed a credit — so there is no rule to reimplement here
            and no URL to assemble. */}
        {stats?.attribution && (
          <p className="text-muted-foreground text-xs">
            <a
              href={stats.attribution.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              {t('statsSource', { source: stats.attribution.label })}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        )}

        {types.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('typeLabel')}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {types.map((term) => (
                <li key={term.id}>
                  <Link href={term.href} prefetch={false}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/15 hover:text-primary transition-colors"
                    >
                      {term.name}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {elements.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {t('elementsLabel')}
            </h3>
            <RideLayoutRail
              elements={elements}
              playerLabels={playerLabels}
              labels={{
                hint: t('elementsHint'),
                has3d: t('has3d'),
                openGlossary: t('openGlossary'),
                // Formatted here, not passed as a formatter: functions cannot
                // cross the RSC boundary. Repeated figures collapse to the same
                // key, which is exactly right — the title only depends on the name.
                viewerTitles: Object.fromEntries(
                  elements.map((element) => [
                    element.name,
                    t('viewerTitle', { name: element.name }),
                  ])
                ),
              }}
            />
          </div>
        )}
      </GlassCard>
    </PageSection>
  );
}
