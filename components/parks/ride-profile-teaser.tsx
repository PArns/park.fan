import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment (`/de/glossar/launch-coaster`)
// and are served by a next.config rewrite, so the i18n <Link> would prefix the
// locale twice. Plain next/link, prefetch off, matching the app-wide default.
import Link from 'next/link';
import { Wrench, CalendarDays, RefreshCcw, ArrowDown, RollerCoaster, Gauge } from 'lucide-react';
import { Badge, badgeLinkProps } from '@/components/ui/badge';
import { Speed } from '@/components/common/unit-display';
import { resolveRideProfile } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileTeaserProps {
  profile: RideProfile;
  locale: Locale;
  /**
   * Extra badges that belong with the ride's facts (the RCDB link), rendered before the jump link,
   * which is pushed to the far right and must stay last in the row.
   */
  children?: ReactNode;
}

/**
 * The ride's identifying facts, lifted into the page header. Every badge names its own fact
 * („Manufacturer: Intamin"), since an unlabelled value in a row of height limits and lands is a
 * guess. Year and inversions show from `sm` up only: on a phone every extra badge pushes the live
 * wait time down. A fragment, so the badges wrap as one group with `AttractionMetaBadges` in the
 * parent's row.
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
    profile.openedYear != null ||
    profile.inversions != null ||
    profile.stats?.topSpeedKmh != null ||
    primaryType !== null;
  if (!hasFacts && elements.length === 0) return <>{children}</>;

  return (
    <>
      {profile.inversions != null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <RefreshCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('inversions')}: {profile.inversions}
        </Badge>
      )}
      {/* Top speed keeps its place next to the inversions — both answer "what
          does it do to you". Visible at every width, unlike the year: it is the
          number people actually came to compare. */}
      {profile.stats?.topSpeedKmh != null && (
        <Badge variant="outline" className="gap-1 tabular-nums">
          <Gauge className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('topSpeed')}: <Speed kmh={profile.stats.topSpeedKmh} />
        </Badge>
      )}
      {/* What kind of ride this is, linked into the glossary like the type chips
          in the profile below. Only the first: the seed lists a ride's types
          from most to least identifying ("Launch Coaster, Terrain Coaster,
          steel coaster"), and the rest are one tap away. */}
      {/* badgeLinkProps, not `<Badge asChild>` — server component, see conventions §14. */}
      {primaryType && (
        <Link
          href={primaryType.href}
          prefetch={false}
          {...badgeLinkProps({ variant: 'outline', className: 'gap-1' })}
        >
          <RollerCoaster className="h-3 w-3 shrink-0" aria-hidden="true" />
          {primaryType.name}
        </Link>
      )}
      {profile.manufacturer && (
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('manufacturer')}: {profile.manufacturer}
        </Badge>
      )}
      {profile.openedYear != null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('opened')}: {profile.openedYear}
        </Badge>
      )}
      {children}
      {elements.length > 0 && (
        <a
          href="#ride-profile"
          className="text-primary hover:bg-primary/10 ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-colors"
        >
          {t('figureCount', { count: elements.length })}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </>
  );
}
