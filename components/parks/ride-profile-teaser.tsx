import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment (`/de/glossar/launch-coaster`)
// and are served by a next.config rewrite, so the i18n <Link> would prefix the
// locale twice. Plain next/link, prefetch off, matching the app-wide default.
import Link from 'next/link';
import { Wrench, CalendarDays, RefreshCcw, ArrowDown, RollerCoaster } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveRideProfile } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileTeaserProps {
  profile: RideProfile;
  locale: Locale;
  /**
   * Extra badges that belong with the ride's facts (the RCDB link). Rendered
   * after them and — crucially — before the jump link, which is pushed to the
   * far right and must stay the last thing in the row.
   */
  children?: ReactNode;
}

/**
 * The ride's identifying facts, lifted into the page header.
 *
 * Every badge names its own fact ("Manufacturer: Intamin", not a wrench and a
 * word): in a row that also carries height limits and a land, an unlabelled
 * value is a guess, and a `title` only helps the half of the audience with a
 * mouse. Inversions lead because they are the one number people compare rides
 * by; the height limit before them is the one that decides whether you may
 * ride at all.
 *
 * Year and inversions are `sm:` and up only. The header already carries the
 * park, the distance, the land and the height limit, and on a 390 px screen
 * every extra badge is another line pushed in front of the live wait time —
 * which is what people came for. The full set sits two thumb-lengths below in
 * the profile itself.
 *
 * Renders a fragment, not its own wrapper, so the badges share the parent's
 * flex row with `AttractionMetaBadges` and wrap as one group.
 */
export async function RideProfileTeaser({ profile, locale, children }: RideProfileTeaserProps) {
  const t = await getTranslations('attraction.rideProfile');
  // Resolved, NOT `profile.elements.length`: ids this app has no glossary term
  // for are dropped downstream, so the raw length would promise nine figures
  // where the rail renders seven. `types` comes from the same call so the
  // header cannot call a ride a multi-launch while the profile below does not.
  const { elements, types } = await resolveRideProfile(profile, locale);
  const primaryType = types[0] ?? null;

  const hasFacts =
    Boolean(profile.manufacturer) ||
    profile.openedYear !== null ||
    profile.inversions !== null ||
    primaryType !== null;
  if (!hasFacts && elements.length === 0) return <>{children}</>;

  return (
    <>
      {profile.inversions !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <RefreshCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('inversions')}: {profile.inversions}
        </Badge>
      )}
      {/* What kind of ride this is, linked into the glossary like the type chips
          in the profile below. Only the first: the seed lists a ride's types
          from most to least identifying ("Launch Coaster, Terrain Coaster,
          steel coaster"), and the rest are one tap away. */}
      {primaryType && (
        <Badge asChild variant="outline" className="gap-1">
          <Link href={primaryType.href} prefetch={false}>
            <RollerCoaster className="h-3 w-3 shrink-0" aria-hidden="true" />
            {primaryType.name}
          </Link>
        </Badge>
      )}
      {profile.manufacturer && (
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('manufacturer')}: {profile.manufacturer}
        </Badge>
      )}
      {profile.openedYear !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('opened')}: {profile.openedYear}
        </Badge>
      )}
      {children}
      {elements.length > 0 && (
        <a
          href="#ride-profile"
          className="text-primary hover:bg-primary/10 ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors"
        >
          {t('figureCount', { count: elements.length })}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
