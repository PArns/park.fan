'use client';

import { Bell, Camera, LineChart, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * The destinations the header carries without giving them a section: `/alerts`, `/favorites`,
 * `/contribute`, and on the phone `/fancast`. One definition for two hosts, the foot of the "more"
 * panel and the foot of the burger sheet, so a new entry cannot land in only one; each entry's
 * `hosts` says where it appears. A footer row rather than a column, so an upload form does not rank
 * with the hubs. The sheet leaves out `/contribute` (nobody opens the phone menu for it) and
 * `/favorites` (the favorites panel above already links it); only the sheet carries `/fancast`,
 * which the desktop band draws as `FancastCard`.
 */
const LINKS = [
  { href: '/alerts', Icon: Bell, key: 'alerts', hosts: ['panel', 'sheet'] },
  { href: '/favorites', Icon: Star, key: 'favorites', hosts: ['panel'] },
  { href: '/fancast', Icon: LineChart, key: 'fancast', hosts: ['sheet'] },
  { href: '/contribute', Icon: Camera, key: 'contribute', hosts: ['panel'] },
] as const;

type Variant = 'panel' | 'sheet';

/**
 * Row of header links to alerts, favourites, Fancast and the photo upload, as pills at the foot of
 * the more panel or as text links in the phone sheet; each `variant` carries its own subset.
 */
export function MoreMenuLinks({ variant }: { variant: Variant }) {
  const t = useTranslations('navigation');
  /*
   * No `navigation.alerts` or `navigation.favorites` keys: `pushAlerts.menu.link` and
   * `favorites.link` are already in `LAYOUT_MESSAGE_NAMESPACES` and name these same URLs, so a
   * second copy would ship twice on every page with nothing keeping the two in step.
   */
  const tPush = useTranslations('pushAlerts.menu');
  const tFavorites = useTranslations('favorites');
  const isSheet = variant === 'sheet';

  const labelFor = (key: (typeof LINKS)[number]['key']) => {
    if (key === 'alerts') return tPush('link');
    if (key === 'favorites') return tFavorites('link');
    return t(key);
  };

  return (
    <div
      data-menu-stagger={isSheet ? undefined : ''}
      data-sheet-stagger={isSheet ? '' : undefined}
      className={`border-border/60 flex flex-wrap items-center border-t ${
        // `min-h-11` in the sheet, where this row is the phone navigation; `gap-y` keeps two 44 px
        // targets from touching when the row wraps. The row is the sheet's footer, outside the
        // scrolling list, so it needs no margin of its own.
        isSheet ? 'gap-x-5 gap-y-1 pt-1' : 'gap-2 pt-4'
      }`}
    >
      {LINKS.filter((link) => (link.hosts as readonly Variant[]).includes(variant)).map(
        ({ href, Icon, key }) => (
          <Link
            key={href}
            href={href}
            prefetch={false}
            className={
              isSheet
                ? 'text-muted-foreground hover:text-foreground flex min-h-11 items-center gap-1.5 text-sm transition-colors'
                : // A pill, as the blog panel's categories end their band. The hover is the full
                  // border and the label going to `foreground`: `text-primary` misses 4.5 : 1 on a
                  // 12 px label.
                  'border-border/70 text-muted-foreground hover:border-primary hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors'
            }
          >
            {/* The accent glyph before the label, as `FavoritesPageMenuLink` and
                `PushAlertsMenuLink` draw it. The label stays muted, which is where the row's lower
                rank lives; the glyph is decorative and `aria-hidden`. */}
            <Icon className="text-primary size-3.5 shrink-0" aria-hidden="true" />
            {labelFor(key)}
          </Link>
        )
      )}
    </div>
  );
}
