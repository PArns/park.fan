'use client';

import { useTranslations } from 'next-intl';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';

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
 * only reachable by opening a catch-all. What is left here is the three that really are a heading
 * and a line, so the rail this panel used to draw beside the blog block went with it — `w-64` and
 * `border-r` describe a relationship to a neighbour, and there is none any more.
 *
 * **Why the trigger is called "more" and not "discover".** The issue's own working title was
 * "Entdecken", which in German would have stood 101 px from "Parks entdecken" in the same row, and
 * in French put "Explorer" next to "Explorer les parcs". The thing is a catch-all — the follow-up
 * tickets hang `/alerts`, `/fancast` and `/contribute` in here as well — and a catch-all is named
 * after being one.
 *
 * **Each section is a heading and a line, and that is the whole of them for now.** Their lists
 * (glossary categories, the guide's chapters, the hub's parks) are separate tickets, so what is
 * here is the skeleton the follow-ups fill in. The heading IS the link, which is what keeps those
 * three hub URLs in the HTML of every page — the band is `hidden`, never unmounted, so a crawler
 * reads it exactly as it read the three entries in the bar.
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

export function MoreMenuPanel({ bestTimeHref, glossaryHref, howtoHref }: MoreMenuPanelProps) {
  // `navigation` only. A `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes — see `BlogMenuPanel` for what that cost the last time.
  const t = useTranslations('navigation');

  const sections = [
    { href: bestTimeHref, label: t('bestTime'), hint: t('bestTimeHint') },
    { href: glossaryHref, label: t('glossary'), hint: t('glossaryHint') },
    { href: howtoHref, label: t('howto'), hint: t('howtoHint') },
  ];

  return (
    <div className="grid grid-cols-3 gap-x-8 gap-y-5">
      {sections.map((section) => (
        <div key={section.href} data-menu-stagger>
          <MenuSectionHeading label={section.label} href={section.href} />
          <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
            {section.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
