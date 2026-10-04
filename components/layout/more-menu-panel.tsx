'use client';

import { memo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BookOpen, CalendarRange, Compass, LineChart, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MoreMenuLinks } from '@/components/layout/more-menu-links';
import type { MoreMenu, MoreMenuChapter, MoreMenuPhoto } from '@/lib/navigation/more-menu';

/**
 * The "more" band: the reading material that has no place of its own in the bar.
 *
 * The desktop bar had six equal entries plus favorites, search and three preference buttons in one
 * 48 px row, and it did not fit: measured on `/parks/europe/germany` before PAR-191, French at a
 * 1024 px container overflowed its box by 23.7 px and took the document to 1032 px, i.e. a
 * horizontal scrollbar on every page; at 1280 px it had exactly 0.0 px left. Four of those entries
 * — best travel time, the dictionary, the guide and the blog — moved one level down, and the blog
 * moved back out again (PAR-270).
 *
 * **Why the trigger is called "more" and not "discover".** The issue's own working title was
 * "Entdecken", which in German would have stood 101 px from "Parks entdecken" in the same row, and
 * in French put "Explorer" next to "Explorer les parcs". The thing is a catch-all — `/alerts`,
 * `/favorites` and `/contribute` hang in here too, in the footer row at the bottom — and a
 * catch-all is named after being one.
 *
 * **Three hubs side by side, each with what it contains** (Patrick, 2026-09-30: „Da fehlen Links,
 * das Wörterbuch … nach links, … die anderen Menüs geben einfach mehr her"). It was three cards of
 * one line each, and under the middle one — the dictionary — its twelve categories: two thirds of
 * the band were empty at a 1280 px bar and wider, the one list in it hung in the middle column,
 * and below 1280 the band was the three cards alone, 231 px against the 455–595 px the news, parks
 * and blog bands open to at a 1024 px bar. Now each hub is a column shaped like the rest of the
 * header's bands — a photo on top, a list under it — and each list is the hub's contents: the
 * dictionary's categories on the left, then the best-time hub's six chapters with the forecasting
 * model under them, then the guide's eleven. The chapter lists come from the same arrays the pages
 * render their own chapters from (`lib/howto/chapters.ts`, `lib/best-time/chapters.ts`);
 * `pnpm test:hub-chapters` fails on a chapter a page does not have.
 *
 * The order is the bar's old one with the dictionary moved to the front, as asked, and the phone
 * sheet lists the three the same way.
 *
 * **Every hub URL stays in the HTML of every page.** Each photo IS the hub's link, and the band is
 * `hidden`, never unmounted, so a crawler reads it the way it read the three entries in the bar.
 * The lists add no crawl target: a category is `/glossar#coasters` and a chapter
 * `/beste-reisezeit#times`, which a crawler reads as the hub itself. The terms stay out, like the
 * parks panel's 144 cities and the blog panel's 31 tags — see `lib/navigation/glossary-menu.ts`.
 *
 * **Three columns at every width the band exists at.** The panel only renders inside the nav row,
 * and that row is `@min-[1024px]:flex` on the same container, so the narrowest column is 309 px
 * (a 1024 px bar). The list used to be `hidden` below a 1280 px bar, because eleven rows under ONE
 * of three cards took the band from ~140 px to ~470 px; with a list under every column the
 * columns share the height. Measured on `/<locale>/parks/europe/germany` in all six locales at a
 * 1024 and a 1440 px bar: the band is 591 px in every one of them (590 at 1440 before), the three
 * columns end within one row of each other — 554, 536.5 and 525 px down the page, the middle one
 * 553 where the Fancast line wraps — and the document is never wider than the window.
 */
interface MoreMenuPanelProps {
  /** Localized hub paths, resolved in the header, which already derives them for the phone sheet. */
  bestTimeHref: string;
  glossaryHref: string;
  howtoHref: string;
  /**
   * The lists and photos, resolved in the layout (`lib/navigation/more-menu.ts`). Absent only if
   * the layout ever stops passing it: the three hubs then stand as photo-less banners with no rows
   * under them, and the band still carries every hub link.
   */
  menu?: MoreMenu;
}

/**
 * The head of a column: the hub's photo with its name, its mark and one line on it — and the
 * hub's link, the whole surface of it.
 *
 * **Text on the photo, not under it**, like the parks panel's photo tiles: under it, the name and
 * the line would be two more rows between the picture and the list it heads.
 *
 * **The scrim is weighted to the lower half, and that is a measurement.** The first one ran
 * `black/85` → `black/45` at the middle → `black/10`, the shape a photo tile gets, and the name
 * sits near the middle here, above two lines of hint: over the lightest pixel of its row, white
 * read **3.23 : 1** on the carousel, 3.37 on the Fenix sky and 3.89 on the Pagode's lights beside
 * Symbolica — under the 4.5 a 15 px label owes. `via-black/65` at 45 % puts the row on at least
 * 55 % black: **4.98, 5.51 and 5.91 : 1**, and the hint (12 px, `white/85`) at 6.57 to 7.45.
 * Sampled off the rendered pixels with the text hidden, at a 1024 and a 1440 px bar; the photos
 * are the same in both themes, so are the numbers. The top of each photo stays clear, which is
 * where its subject is.
 *
 * `h-32` at every width. The name, the two lines of hint and the foot padding take 68 of the
 * 128 px; a 16:9 box at the narrowest column (309 px, a 1024 px bar) would be 174 px tall and push
 * every list down by 46 px for sky.
 *
 * A missing photo leaves `neutral-800` under the same scrim, so the banner keeps its height and
 * its white text stays legible — the fallback is a dark tile, not a hole.
 */
function HubBanner({
  href,
  icon: Icon,
  label,
  hint,
  count,
  photo,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  count?: number;
  photo: MoreMenuPhoto | null;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="group focus-visible:ring-ring relative block h-32 overflow-hidden rounded-xl bg-neutral-800 focus-visible:ring-2 focus-visible:outline-none"
    >
      {photo && (
        /* A fixed size rather than `fill`, for the reason the news panel gives: this markup ships
           `hidden` on every page, and `fill` lists every configured width in its srcset. 480 is
           the widest the column gets (a 1536 px bar); the 2x candidate covers the rest. */
        <Image
          src={photo.src}
          alt=""
          width={480}
          height={160}
          style={photo.position ? { objectPosition: photo.position } : undefined}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 via-45% to-black/0"
      />
      <span className="absolute inset-x-3.5 bottom-3 flex flex-col gap-1">
        <span className="flex items-center gap-2 text-white">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-[15px] leading-tight font-semibold">{label}</span>
          {count != null && <span className="text-xs text-white/75 tabular-nums">{count}</span>}
        </span>
        {/* Two lines reserved whether the line needs them or not, so the three names stand on
            one line across the band: the text is anchored to the foot of the photo, and a hint
            that fits one line dropped its name by that line. „Meilleure période" at a 1024 px bar
            stood 16.5 px below „Dictionnaire" and „Comment ça marche", whose lines wrap there. */}
        <span className="line-clamp-2 min-h-[2lh] text-xs leading-snug text-pretty text-white/85">
          {hint}
        </span>
      </span>
    </Link>
  );
}

/**
 * The rows under a banner. One shape for the dictionary's categories and for a hub's chapters —
 * the parks panel's country row: label, a number, the `-mx-2` bleed that lets the hover reach
 * into the column gap — so the bands read as one surface.
 *
 * The number sits where the row's kind puts it. A category's is a count and stands right, as the
 * countries' do; a chapter's is its place in the page and stands first, in the accent the guide's
 * own chapter list gives it, so the column reads as a table of contents.
 *
 * **One row height in all three lists**, 29 px with the `space-y-px` between rows, so a row in one
 * column stands level with its neighbours in the other two. The chapter label had `leading-snug`
 * at first, 0.75 px shorter per row, and by the eleventh chapter the guide's rows stood 7.5 px out
 * of step with the dictionary's.
 *
 * A chapter label may wrap and a category label may not: cut at the end, a chapter would lose the
 * words that say what it is about, while a category is a single term. None wraps today — the
 * longest, „Een parkpagina van boven naar beneden", is 259.6 px in a 281.3 px label box at a
 * 1024 px bar, the narrowest the band gets.
 */
const ROW =
  'text-muted-foreground hover:text-foreground hover:bg-muted/60 -mx-2 flex gap-2 rounded-md px-2 py-1 text-sm transition-colors';

function ChapterList({ label, chapters }: { label: string; chapters: MoreMenuChapter[] }) {
  if (chapters.length === 0) return null;
  return (
    <ol aria-label={label} className="space-y-px">
      {chapters.map((chapter) => (
        <li key={chapter.href}>
          <Link href={chapter.href as '/'} prefetch={false} className={`${ROW} items-baseline`}>
            <span className="text-primary/70 w-5 shrink-0 text-xs font-semibold tabular-nums">
              {chapter.index}
            </span>
            <span className="min-w-0 flex-1 text-pretty">{chapter.label}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Memoised for the same reason as `ParksMenuPanel`. */
export const MoreMenuPanel = memo(function MoreMenuPanel({
  bestTimeHref,
  glossaryHref,
  howtoHref,
  menu,
}: MoreMenuPanelProps) {
  // `navigation` only. A `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes — see `BlogMenuPanel` for what that cost the last time.
  const t = useTranslations('navigation');

  const categories = menu?.glossary.categories ?? [];

  // `CalendarRange` and `BookOpen` are the icons `BlogChapter` already gives these two hubs on the
  // homepage, and `Compass` the guide's in the bar and the phone sheet — the same destination gets
  // the same mark wherever it is offered. `LineChart` is Fancast's in the footer row it came from.
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-x-8 gap-y-5">
        {/* The dictionary: its categories, each an anchor on the overview rather than a filtered
            view, because the overview's filter is client state with no URL of its own. The label
            of the list is the banner's, so the rows keep saying whose they are to a screen reader
            that reaches them without the column. */}
        <div data-menu-stagger className="flex min-w-0 flex-col gap-3">
          <HubBanner
            href={glossaryHref}
            icon={BookOpen}
            label={t('glossary')}
            hint={t('glossaryHint')}
            // The terms in the listed categories, not `GLOSSARY_TERMS.length`: a number over a list
            // that counts more than the rows under it add up to is wrong about them.
            count={menu?.glossary.termCount || undefined}
            photo={menu?.glossary.photo ?? null}
          />
          {categories.length > 0 && (
            <ul aria-label={t('glossary')} className="space-y-px">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.href as '/'}
                    prefetch={false}
                    className={`${ROW} items-center`}
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

        {/* The best-time hub, chapter by chapter, and the model behind its crowd calendar. */}
        <div data-menu-stagger className="flex min-w-0 flex-col gap-3">
          <HubBanner
            href={bestTimeHref}
            icon={CalendarRange}
            label={t('bestTime')}
            hint={t('bestTimeHint')}
            photo={menu?.bestTime.photo ?? null}
          />
          <ChapterList label={t('bestTime')} chapters={menu?.bestTime.chapters ?? []} />
          <FancastCard photo={menu?.fancast.photo ?? null} />
        </div>

        {/* The guide, chapter by chapter. */}
        <div data-menu-stagger className="flex min-w-0 flex-col gap-3">
          <HubBanner
            href={howtoHref}
            icon={Compass}
            label={t('howto')}
            hint={t('howtoHint')}
            photo={menu?.howto.photo ?? null}
          />
          <ChapterList label={t('howto')} chapters={menu?.howto.chapters ?? []} />
        </div>
      </div>

      {/* The footer row — `/alerts`, `/favorites`, `/contribute`. See `MoreMenuLinks` for why it
          is a row rather than a fourth column and why the sheet renders the same component. */}
      <MoreMenuLinks variant="panel" />
    </div>
  );
});

/**
 * Fancast, under the chapters of the hub it serves: the crowd calendar that chapter 05 of the
 * best-time page explains is Fancast's forecast, and that page points at the model in a
 * `LandingNextSteps` band with Fancast as its one destination. It stood in the footer row before,
 * one word among the personal pages, which ranked the forecasting model with „Meine Alarme".
 *
 * **A photo strip on top, like the banners over it but a card.** Six chapters are 174 px against
 * the dictionary's twelve rows and the guide's eleven, and the column stood half empty; the card
 * fills it to within one row of the other two (its foot 536.5 px down the page, the lists' 554 and
 * 525). It was a thumbnail beside the text at first, pinned to the column's floor with `mt-auto`,
 * which left about 100 px of nothing between the last chapter and the card. The border and the
 * smaller photo keep it a rank below the three hubs: it has no name on the photo and no list of
 * its own.
 *
 * **The hover is the border, never the label's colour**, measured when these were the band's three
 * cards: `text-primary` is 3.47 : 1 on the light card and a 14 px semibold label is not WCAG large
 * text, while a border owes 3 : 1 and `border-primary` reads 3.46 : 1 light and 5.31 : 1 dark
 * against the card.
 */
function FancastCard({ photo }: { photo: MoreMenuPhoto | null }) {
  const t = useTranslations('navigation');
  return (
    <Link
      href="/fancast"
      prefetch={false}
      className="group border-border/60 bg-card/50 hover:border-primary focus-visible:ring-ring mt-1 block overflow-hidden rounded-xl border transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="relative block h-20 overflow-hidden bg-neutral-800">
        {photo && (
          <Image
            src={photo.src}
            alt=""
            width={480}
            height={120}
            style={photo.position ? { objectPosition: photo.position } : undefined}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
      </span>
      <span className="block px-3 py-2.5">
        <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
          <LineChart className="text-primary size-3.5 shrink-0" aria-hidden="true" />
          {t('fancast')}
        </span>
        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs leading-snug">
          {t('fancastHint')}
        </span>
      </span>
    </Link>
  );
}
