'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, CalendarRange, Compass, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MoreMenuLinks } from '@/components/layout/more-menu-links';
import type { GlossaryMenu } from '@/lib/navigation/glossary-menu';

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
 * in French put "Explorer" next to "Explorer les parcs". The thing is a catch-all — `/alerts`,
 * `/favorites`, `/fancast` and `/contribute` hang in here too, in the footer row at the bottom —
 * and a catch-all is named after being one.
 *
 * **Each section is a card, and that is the whole of them for now (PAR-269).** Their lists
 * (the guide's chapters, the hub's parks) are separate tickets, so what is here is the skeleton the
 * follow-ups fill in. Each card IS the link, which is what keeps those three hub URLs in the HTML
 * of every page — the band is `hidden`, never unmounted, so a crawler reads it exactly as it read
 * the three entries in the bar.
 *
 * **The glossary card carries its categories too (PAR-235)**, the one place in the app that says
 * what is in the dictionary before a reader is already inside it: 274 terms behind one bare
 * `/glossary` link until now, and eleven category rows below the card — the categories the
 * overview itself draws, which is twelve minus the one PAR-264 is about. Terms themselves stay
 * out, like the parks panel's 144 cities and the blog panel's 31 tags — see
 * `lib/navigation/glossary-menu.ts`, which also explains why the labels arrive as props instead of
 * a `useTranslations('glossary')` here. Each row points at `/{segment}#{category}`, an anchor on
 * the overview rather than a filtered view, because the overview's filter is client state with no
 * URL of its own — a fragment is not a second crawl target.
 *
 * They were a `MenuSectionHeading` plus a `<p>` until PAR-269: an uppercase rule carrying the only
 * link, with the line under it outside the hit area. Three rules stacked in a column read as three
 * captions rather than as a menu, and the clickable part was the 16 px rule rather than the block a
 * reader points at. `MoreMenuCard` is the same content in the shape `BlogChapter` already uses on
 * the homepage for two of these same three destinations — icon tile, title, line, whole surface
 * clickable.
 *
 * **A footer row links the pages the header never linked at all (PAR-255)**: `/alerts`,
 * `/fancast` and `/contribute`, plus `/favorites` since PAR-290. Measured on `main` before that
 * change, a grep over `components/layout/` found `/fancast` once (the footer), `/alerts` once (the
 * favorites panel) and `/contribute` nowhere — the upload form was reachable from a park or ride
 * page's banner and from a typed URL and from nothing else. It is a row under the closing rule
 * rather than a fourth card: a card would rank an upload form with the guide and the dictionary,
 * and a row is one element whichever column shape the grid is in. No heading over it either,
 * because a heading here is a promise of a hub page and these have nothing above them.
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
  /**
   * The dictionary's categories with their labels already translated, resolved in the layout.
   * Absent only if the layout ever stops passing them; the card then reads as it did before, with
   * no rows under it.
   */
  glossary?: GlossaryMenu;
}

/**
 * One section of the panel: an icon tile, the destination's name, and the line under it.
 *
 * `size-9` and `p-3`, where the homepage's version of this card is `size-10` in `p-5`: this one
 * sits three to a row inside a 48 px bar's drop-down.
 *
 * **The icon sits above the text and not beside it, and the rail is what decides that.** Beside the
 * text it leaves 157 px of the rail's 231 px card for a title and a line: "Beste Reisezeit" still
 * fits, its hint went to three lines and broke as "und Monate, Park / für Park." Above it, the text
 * gets the full 205 px, every title stays on one line and the hints run to two — 112.6 px of card
 * against 137.5, in a column that had 458 px of nothing under it.
 *
 * **The hover is the border, never the label's colour.** `text-primary` is 3.47 : 1 on the light
 * card, and a 14 px semibold label is not WCAG large text, so tinting it on hover would put the
 * card's own title under 4.5 : 1 for as long as a pointer rests on it — the one moment it is
 * certainly being read. A border owes 3 : 1 (WCAG 1.4.11) rather than 4.5, which is why the state
 * can live there instead.
 *
 * It is `border-primary` at full strength for the same measurement. `/40`, which is what
 * `BlogChapter` hovers with on a page-sized card, samples at **1.60 : 1** light and 1.81 : 1 dark
 * against the card behind it — a hairline that faint on a 1 px border is a state nobody can name.
 * Solid reads **3.46 : 1** light and 5.31 : 1 dark, and clears the line in both themes.
 *
 * **And the hover moves nothing else, because every candidate cost more than it bought.**
 * `bg-card/50` → `bg-card` measured 19.76 → 19.80 : 1 under the label, i.e. a change no eye
 * resolves. A real tint does the damage instead: `bg-primary/5` took the 13 px hint from 4.73 : 1
 * to **4.47 : 1** on the light card, under the 4.5 that size owes. The border is the whole state.
 *
 * **`count`** is the number beside the label — the terms in the listed categories, not the whole
 * dictionary, so it never claims more than the rows under it add up to. Only the glossary card
 * passes one.
 */
function MoreMenuCard({
  href,
  icon: Icon,
  label,
  hint,
  count,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  count?: number;
}) {
  return (
    <Link
      data-menu-stagger
      href={href as '/'}
      prefetch={false}
      className="border-border/60 bg-card/50 hover:border-primary focus-visible:ring-ring block rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="bg-primary/10 text-primary mb-2.5 flex size-9 items-center justify-center rounded-lg">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="text-foreground flex items-baseline gap-2 text-sm leading-snug font-semibold text-pretty">
        <span className="truncate">{label}</span>
        {count != null && (
          <span className="text-muted-foreground/70 shrink-0 text-[11px] font-normal tabular-nums">
            {count}
          </span>
        )}
      </span>
      <span className="text-muted-foreground mt-1 block text-[13px] leading-relaxed text-pretty">
        {hint}
      </span>
    </Link>
  );
}

export function MoreMenuPanel({
  bestTimeHref,
  glossaryHref,
  howtoHref,
  glossary,
}: MoreMenuPanelProps) {
  // `navigation` only. A `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes — see `BlogMenuPanel` for what that cost the last time.
  const t = useTranslations('navigation');

  const categories = glossary?.categories ?? [];

  // `CalendarRange` and `BookOpen` are the icons `BlogChapter` already gives these two hubs on the
  // homepage — the same destination gets the same mark wherever it is offered. `Compass` is the
  // guide's, and it is the one of the three that had no prior mark to inherit.
  const sections = [
    { href: bestTimeHref, icon: CalendarRange, label: t('bestTime'), hint: t('bestTimeHint') },
    {
      href: glossaryHref,
      icon: BookOpen,
      label: t('glossary'),
      hint: t('glossaryHint'),
      // The number is the terms in the listed categories, not `GLOSSARY_TERMS.length`: a card
      // that counts more than the rows under it add up to is a card that is wrong about them.
      count: glossary?.termCount,
    },
    { href: howtoHref, icon: Compass, label: t('howto'), hint: t('howtoHint') },
  ];

  /* The footer row — `/favorites`, `/alerts`, `/fancast`, `/contribute`. See `MoreMenuLinks` for
     why it is a row rather than a fourth column, why the favorites entry is the one of the four
     the burger sheet does not get, and why the sheet renders the same component at all. */
  const extras = <MoreMenuLinks variant="panel" />;

  /* Which column the dictionary's rows hang under, read off the list above rather than written
     down as `col-start-2`. The cards are direct grid items now (see below), so the rows are no
     longer inside the card's own cell and cannot inherit its column by position. */
  const glossaryColumn = sections.findIndex((section) => section.href === glossaryHref) + 1;

  return (
    <div className="flex flex-col gap-5">
      {/* **The three cards are grid items themselves, and that is what makes them one height.**
          A grid item stretches to its row by default, so the cards would have agreed all along —
          except each sat in a `<div>` of its own, and in the dictionary's cell that wrapper holds
          the card AND the eleven category rows. An `h-full` on the card would have stretched it
          over the rows there, so the wrapper goes instead and the rows become a grid item of their
          own in the second row, under the column the card stands in.

          Measured on `/de/parks/europe/germany` at a 1440 px bar, before: 116.4 / 116.4 / 137.5 px
          — a card is 116.4 px while its hint fits one line and 137.5 px on two, and „So
          funktioniert's" is the German hint that wraps. In French the odd card is the dictionary
          instead (116.4 / 137.5 / 116.4) and in English no hint wraps at all, so all three were
          116.4 px there and this change moves nothing. Which bottom edge sticks out is a property
          of the translation, not of the layout. The hint box is 382 px at a 1280 px bar and at a
          1440 px one alike, so the line counts are the same across that range; measured with the
          webfont loaded, because „Geist Fallback" is wider and a reading taken before
          `document.fonts.ready` wraps lines the built page does not. */}
      <div className="grid grid-cols-3 gap-3">
        {sections.map((section) => (
          <MoreMenuCard key={section.href} {...section} />
        ))}
        {/* The same row as a country in the parks panel — label, count, `-mx-2` bleed — because
            the two bands are meant to read as one surface. The 10 px that used to sit above this
            list as an `mt-2.5` is the grid's own 12 px row gap now: the list is a row of the grid
            rather than the lower half of a cell.

            **Drawn from 1280 px of the BAR, and in the document at every width** — the same
            `hidden … @min-[1280px]:block` the parks panel's photo rail carries, at the same
            threshold and for the same reason. From 1280 px the band is as tall as these eleven
            rows make it whatever else is in it, so they are what the reader came for rather than
            an addition to a menu. Below that the three sections are a flat `grid-cols-3`, a grid
            row is as tall as its tallest cell, and eleven rows under one of three cards took the
            band from ~140 px to ~470 px — the same kind of shift PAR-235 measured and refused at
            1024 px before this panel became cards.

            PAR-290 moved the list out of the card's cell and put **23.1 px** on the band at
            1440 px (the footer row went 544.4 → 567.5): the card row is the tallest card now
            rather than the dictionary's own height, and the 10 px `mt-2.5` became the grid's
            12 px. That is the price of the three cards agreeing, and it is paid once, above a
            list that is ~330 px tall.

            Two columns there instead of one was measured and refused: the cell is narrow at
            1024 px, and `truncate` then ellipsized „Achterbahnelemente" and three of the French
            labels, up to „Expérience de manège". A menu word may not be cut.

            `hidden`, never unmounted, is what keeps the eleven links in the HTML of every page at
            every width — the same rule that puts the closed band there at all.

            **The list carries the dictionary's name** because it no longer sits inside its cell.
            A sighted reader gets the association from the column; in the DOM the rows used to
            follow the card they belong to and now follow all three, so the only thing left saying
            whose rows these are is the label. It is the card's own `navigation.glossary`, so the
            two can never disagree, and the namespace is one the chrome already ships. */}
        {categories.length > 0 && glossaryColumn > 0 && (
          <ul
            aria-label={t('glossary')}
            style={{ gridColumnStart: glossaryColumn }}
            className="hidden space-y-px @min-[1280px]:block"
          >
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={category.href as '/'}
                  prefetch={false}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/60 -mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
                >
                  <span className="min-w-0 flex-1 truncate">{category.label}</span>
                  <span className="text-muted-foreground/70 text-xs tabular-nums">
                    {category.termCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {extras}
    </div>
  );
}
