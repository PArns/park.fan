import { getTranslations } from 'next-intl/server';
import { Wrench, CalendarDays, RefreshCcw, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveRideProfile } from '@/lib/glossary/ride-profile';
import type { Locale } from '@/i18n/config';
import type { RideProfile } from '@/lib/api/types';

interface RideProfileTeaserProps {
  profile: RideProfile;
  locale: Locale;
}

/**
 * The ride's identifying facts, lifted into the page header.
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
export async function RideProfileTeaser({ profile, locale }: RideProfileTeaserProps) {
  const t = await getTranslations('attraction.rideProfile');
  // Resolved, NOT `profile.elements.length`: ids this app has no glossary term
  // for are dropped downstream, so the raw length would promise nine figures
  // where the rail renders seven.
  const { elements } = await resolveRideProfile(profile, locale);

  const hasFacts =
    Boolean(profile.manufacturer) || profile.openedYear !== null || profile.inversions !== null;
  if (!hasFacts && elements.length === 0) return null;

  return (
    <>
      {profile.manufacturer && (
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-3 w-3 shrink-0" aria-hidden="true" />
          {profile.manufacturer}
        </Badge>
      )}
      {profile.openedYear !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
          {profile.openedYear}
        </Badge>
      )}
      {profile.inversions !== null && (
        <Badge variant="outline" className="hidden gap-1 tabular-nums sm:inline-flex">
          <RefreshCcw className="h-3 w-3 shrink-0" aria-hidden="true" />
          {t('inversions')}: {profile.inversions}
        </Badge>
      )}
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
