import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment (`/de/glossar/looping`) and are
// served by a next.config rewrite, so the i18n <Link> would prefix the locale a
// second time. Plain next/link it is — but with prefetch off, matching the
// app-wide default in i18n/no-prefetch-link.
import Link from 'next/link';
import { Wrench, CalendarDays, RefreshCcw, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/common/glass-card';
import { PageSection } from '@/components/common/page-section';
import { RideLayoutRail } from '@/components/parks/ride-layout-rail';
import { resolveRideProfile } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileSectionProps {
  profile: RideProfile;
  locale: Locale;
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

  const hasFacts =
    Boolean(profile.manufacturer) || profile.openedYear !== null || profile.inversions !== null;

  if (elements.length === 0 && types.length === 0 && !hasFacts) return null;

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
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <Wrench className="h-3.5 w-3.5" />
                  {t('manufacturer')}
                </dt>
                <dd className="text-sm font-semibold">
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
                </dd>
              </div>
            )}

            {profile.openedYear !== null && (
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {t('opened')}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{profile.openedYear}</dd>
              </div>
            )}

            {profile.inversions !== null && (
              <div className="space-y-1">
                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                  <RefreshCcw className="h-3.5 w-3.5" />
                  {t('inversions')}
                </dt>
                <dd className="text-sm font-semibold tabular-nums">{profile.inversions}</dd>
              </div>
            )}
          </dl>
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
