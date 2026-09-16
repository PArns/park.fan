'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, CalendarRange, Compass, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * The "more" band: the reading material that has no place of its own in the bar.
 *
 * The desktop bar had six equal entries plus favorites, search and three preference buttons in one
 * 48 px row, and it did not fit: measured on `/parks/europe/germany` before PAR-191, French at a
 * 1024 px container overflowed its box by 23.7 px and took the document to 1032 px, i.e. a
 * horizontal scrollbar on every page; at 1280 px it had exactly 0.0 px left. Four of those entries
 * — best travel time, the dictionary, the guide and the blog — moved one level down.
 *
 * **The blog moved back out (PAR-270)** and is a bar entry again, with the panel it always had.
 * Three of the six were what did not fit; one of them is the site's strongest entry point and was
 * only reachable by opening a catch-all. What is left here is the three that remain, so the rail
 * this panel used to draw beside the blog block went with it — `w-64` and `border-r` describe a
 * relationship to a neighbour, and there is none any more.
 *
 * **Why the trigger is called "more" and not "discover".** The issue's own working title was
 * "Entdecken", which in German would have stood 101 px from "Parks entdecken" in the same row, and
 * in French put "Explorer" next to "Explorer les parcs". The thing is a catch-all — the follow-up
 * tickets hang `/alerts`, `/fancast` and `/contribute` in here as well — and a catch-all is named
 * after being one.
 *
 * **Each section is a card, and that is the whole of them for now (PAR-269).** Their lists
 * (glossary categories, the guide's chapters, the hub's parks) are separate tickets, so what is
 * here is the skeleton the follow-ups fill in. Each card IS the link, which is what keeps those
 * three hub URLs in the HTML of every page — the band is `hidden`, never unmounted, so a crawler
 * reads it exactly as it read the three entries in the bar.
 *
 * They were a `MenuSectionHeading` plus a `<p>` until PAR-269: an uppercase rule carrying the only
 * link, with the line under it outside the hit area. Three rules stacked in a column read as three
 * captions rather than as a menu, and the clickable part was the 16 px rule rather than the block a
 * reader points at. `MoreMenuCard` is the same content in the shape `BlogChapter` already uses on
 * the homepage for two of these same three destinations — icon tile, title, line, whole surface
 * clickable.
 *
 * `grid-cols-3` with no threshold under it: this panel only ever renders inside the nav row, and
 * that row is `@min-[1024px]:flex` on the same container, so a one-column state has no width at
 * which anybody could see it.
 */
interface MoreMenuPanelProps {
  /** Localized hub paths, resolved in the header, which already derives them for the phone sheet. */
  bestTimeHref: string;
  glossaryHref: string;
  howtoHref: string;
}

/**
 * One section of the panel: an icon tile, the destination's name, and the line under it.
 *
 * `size-9` and `p-3`, where the homepage's version of this card is `size-10` in `p-5`: this one
 * sits three to a row inside a 48 px bar's drop-down.
 *
 * The hover is the border and the surface, never the label's colour. `text-primary` is 3.47 : 1 on
 * the light card, and a 14 px semibold label is not WCAG large text, so tinting it on hover would
 * put the card's own title under 4.5 : 1 for as long as a pointer rests on it — the one moment it
 * is certainly being read. The border carries the state instead, which owes 3 : 1 and clears it.
 */
function MoreMenuCard({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      data-menu-stagger
      href={href as '/'}
      prefetch={false}
      className="border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card focus-visible:ring-ring flex items-start gap-3 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="text-foreground block text-sm leading-snug font-semibold text-pretty">
          {label}
        </span>
        <span className="text-muted-foreground mt-1 block text-[13px] leading-relaxed text-pretty">
          {hint}
        </span>
      </span>
    </Link>
  );
}

export function MoreMenuPanel({ bestTimeHref, glossaryHref, howtoHref }: MoreMenuPanelProps) {
  // `navigation` only. A `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes — see `BlogMenuPanel` for what that cost the last time.
  const t = useTranslations('navigation');

  // `CalendarRange` and `BookOpen` are the icons `BlogChapter` already gives these two hubs on the
  // homepage — the same destination gets the same mark wherever it is offered. `Compass` is the
  // guide's, and it is the one of the three that had no prior mark to inherit.
  const sections = [
    { href: bestTimeHref, icon: CalendarRange, label: t('bestTime'), hint: t('bestTimeHint') },
    { href: glossaryHref, icon: BookOpen, label: t('glossary'), hint: t('glossaryHint') },
    { href: howtoHref, icon: Compass, label: t('howto'), hint: t('howtoHint') },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {sections.map((section) => (
        <MoreMenuCard key={section.href} {...section} />
      ))}
    </div>
  );
}
