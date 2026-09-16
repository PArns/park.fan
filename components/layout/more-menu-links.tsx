'use client';

import { Bell, Camera, LineChart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * The three destinations the header carries without giving them a section: `/alerts`, `/fancast`
 * and `/contribute`.
 *
 * Measured on `main` before they were added: a grep over `components/layout/` finds `/fancast`
 * once (the footer) and `/alerts` once (the favorites panel), and `/contribute` **not at all**, so
 * the upload form was reachable from a park or ride page's banner, from a typed URL, and from
 * nothing else.
 *
 * **One definition, two hosts**, which is the same call `PushAlertsMenuLink` one file over already
 * made: the row renders at the foot of the "more" panel above `@min-[1024px]` and at the foot of
 * the burger sheet below it, and two hand-kept copies of a three-entry list are two places for the
 * fourth entry — or a changed path — to land in only one of them. The two differ in type scale and
 * in nothing else, so `variant` is the whole parameter.
 *
 * **Why the sheet gets it at all**, when the issue only named the panel: the nav row that carries
 * the panel is `@min-[1024px]:flex`, so without this row `/alerts`, `/fancast` and `/contribute`
 * stay unreachable from the header on every phone. The sheet is what the panel stands in for down
 * there.
 *
 * **It is a footer, not a fourth column.** A column would rank an upload form with the guide and
 * the dictionary, and the panel already switches column shape at a bar width of 1280 px, so a
 * fourth member would have to be fitted into both layouts. A row is one element in either. No
 * heading over it either: a heading in this panel is a link to a hub page, and these three have
 * none above them.
 */
const LINKS = [
  { href: '/alerts', Icon: Bell, key: 'alerts' },
  { href: '/fancast', Icon: LineChart, key: 'fancast' },
  { href: '/contribute', Icon: Camera, key: 'contribute' },
] as const;

export function MoreMenuLinks({ variant }: { variant: 'panel' | 'sheet' }) {
  const t = useTranslations('navigation');
  /*
   * The alerts label is NOT `navigation.alerts`, and there is deliberately no such key. The one it
   * would duplicate — `pushAlerts.menu.link` — is byte-identical in all six locales and is already
   * in `LAYOUT_MESSAGE_NAMESPACES`, so it reaches the client on every page either way; a second
   * copy would be the same string serialized twice on ~35,000 pages × 6 locales, with nothing
   * holding the two in step. The favorites panel reads this same key for this same destination.
   */
  const tPush = useTranslations('pushAlerts.menu');
  const isSheet = variant === 'sheet';

  return (
    <div
      data-menu-stagger={isSheet ? undefined : ''}
      data-sheet-stagger={isSheet ? '' : undefined}
      className={`border-border/60 flex flex-wrap items-center border-t ${
        // `min-h-11` in the sheet: it is the navigation on a phone, and this is the one row here
        // whose hit area does not already come from its type size. `gap-y` is load-bearing with
        // it — the row wraps to two lines in all six locales at 320 and 360 px, and without it two
        // 44 px tap targets abut at exactly 0 px.
        isSheet ? 'gap-x-5 gap-y-1 pt-2' : 'gap-x-6 gap-y-2 pt-3'
      }`}
    >
      {LINKS.map(({ href, Icon, key }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          className={`text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors ${
            isSheet ? 'min-h-11 text-sm' : 'text-[13px]'
          }`}
        >
          <Icon className="size-3.5 shrink-0" aria-hidden="true" />
          {key === 'alerts' ? tPush('link') : t(key)}
        </Link>
      ))}
    </div>
  );
}
