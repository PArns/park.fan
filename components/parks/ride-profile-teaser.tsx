import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
// Glossary URLs carry their own locale segment (`/de/glossar/launch-coaster`)
// and are served by a next.config rewrite, so the i18n <Link> would prefix the
// locale twice. Plain next/link, prefetch off, matching the app-wide default.
import Link from 'next/link';
import {
  ArrowDown,
  CalendarDays,
  Gauge,
  RefreshCcw,
  RollerCoaster,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { GLASS_BUTTON } from '@/components/common/glass-card';
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

/** One figure of the strip: a small label over its value. */
function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="shrink-0">
      <dt className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium tracking-wider uppercase">
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * The ride's identifying facts in the page header, as a strip of figures — top speed, inversions,
 * type, manufacturer, opening year — each a small label over its value, like the live panel's
 * figures; then the RCDB link (`children`) and the jump to the ride's figures as buttons. Below
 * `sm` the strip scrolls sideways instead of wrapping in front of the live wait.
 */
export async function RideProfileTeaser({ profile, locale, children }: RideProfileTeaserProps) {
  const t = await getTranslations('attraction.rideProfile');
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
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      {hasFacts && (
        <dl className="no-scrollbar flex min-w-0 gap-x-7 max-sm:-mx-6 max-sm:overflow-x-auto max-sm:px-6 sm:flex-wrap sm:gap-y-3">
          {profile.stats?.topSpeedKmh != null && (
            <Fact icon={Gauge} label={t('topSpeed')}>
              <Speed kmh={profile.stats.topSpeedKmh} />
            </Fact>
          )}
          {profile.inversions != null && (
            <Fact icon={RefreshCcw} label={t('inversions')}>
              {profile.inversions}
            </Fact>
          )}
          {/* Linked into the glossary like the type chips in the profile below. Only the
              first: the seed lists a ride's types from most to least identifying. */}
          {primaryType && (
            <Fact icon={RollerCoaster} label={t('typeLabel')}>
              <Link
                href={primaryType.href}
                prefetch={false}
                className="hover:text-primary underline decoration-dotted underline-offset-4 transition-colors"
              >
                {primaryType.name}
              </Link>
            </Fact>
          )}
          {profile.manufacturer && (
            <Fact icon={Wrench} label={t('manufacturer')}>
              {profile.manufacturer}
            </Fact>
          )}
          {profile.openedYear != null && (
            <Fact icon={CalendarDays} label={t('opened')}>
              {profile.openedYear}
            </Fact>
          )}
        </dl>
      )}
      {(children || elements.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {elements.length > 0 && (
            <a href="#ride-profile" className={GLASS_BUTTON}>
              {t('figureCount', { count: elements.length })}
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
