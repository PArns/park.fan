import { getTranslations } from 'next-intl/server';
import { Boxes, Clock, HelpCircle, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EntryTileBody, entryTileBox } from '@/components/common/entry-tile';
import { EntryTileReveal } from '@/components/common/entry-tile-reveal';
import { cn } from '@/lib/utils';

interface RideSectionNavProps {
  /** The ride carries a curated `rideProfile`, so the Bahnprofil chapter renders. */
  hasRideProfile: boolean;
  /** The FAQ chapter renders for this ride. */
  hasFaq: boolean;
  className?: string;
}

/**
 * The ride page's chapter row — the park page's entry tiles, one page type over.
 *
 * These are **jump links, not tabs**, and the difference is the whole point. The park page's
 * tiles switch a `Tabs` whose inactive panels are not in the DOM; doing the same here would
 * take the typical-wait table, the 30-day history, the ride profile and the FAQ out of the
 * served HTML of every ride page on the site, which is most of what a ride page is for. The
 * chapters stay where they are and the row is a way to reach them — same box, same chip, same
 * grid, so a ride reads like the park it belongs to (the header already does this deliberately).
 *
 * A Server Component on purpose: it adds nothing to the client bundle and no namespace to the
 * routed messages — every label here is one a chapter heading on this page already renders.
 *
 * Nothing marks a tile "current". A scroll position is not a selection, and the honest version
 * of that (a scroll spy) would mean a Client Component, an observer per chapter and a moving
 * highlight on a page whose chapters are metres tall.
 */
export async function RideSectionNav({ hasRideProfile, hasFaq, className }: RideSectionNavProps) {
  const t = await getTranslations('attractions');
  const tProfile = await getTranslations('attraction.rideProfile');
  const tFaq = await getTranslations('seo.faq.attraction');

  const items: { href: string; icon: LucideIcon; label: string }[] = [
    { href: '#live', icon: Clock, label: t('sectionLiveNow') },
    { href: '#plan', icon: Sparkles, label: t('sectionPlanVisit') },
    ...(hasRideProfile ? [{ href: '#ride-profile', icon: Boxes, label: tProfile('title') }] : []),
    ...(hasFaq ? [{ href: '#faq', icon: HelpCircle, label: tFaq('title') }] : []),
  ];

  return (
    // The wrapper is a Client Component and adds `display: contents`, so it owns the mount
    // animation without owning a box or pulling this nav across the client boundary — the tiles
    // below are still server-rendered into the HTML.
    <EntryTileReveal>
      <nav
        aria-label={t('sectionNavLabel')}
        className={cn(
          'grid auto-rows-fr grid-cols-2 gap-3',
          // Three chapters is the common case (a ride with a profile but no FAQ, or the other
          // way round); four is the full house. Both divide evenly at these two breakpoints, so
          // no width leaves a single tile stranded on its own row.
          items.length >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3',
          className
        )}
      >
        {items.map(({ href, icon, label }) => (
          <a key={href} href={href} className={cn(entryTileBox, 'hover:border-primary/60')}>
            <EntryTileBody icon={icon} label={label} />
          </a>
        ))}
      </nav>
    </EntryTileReveal>
  );
}
