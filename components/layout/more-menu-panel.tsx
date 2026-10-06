'use client';

import { memo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { BookOpen, CalendarRange, Compass, LineChart, type LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { MoreMenuLinks } from '@/components/layout/more-menu-links';
import type { MoreMenu, MoreMenuChapter, MoreMenuPhoto } from '@/lib/navigation/more-menu';

/**
 * The "more" band: the reading material that has no place of its own in the bar. Named "more"
 * rather than "discover" because it is a catch-all and „Parks entdecken" already sits beside it.
 * Three hub columns, each a photo and what the hub holds: the dictionary's categories, the
 * best-time hub's chapters with the forecasting model, and the guide's chapters, from the arrays
 * the pages render (`pnpm test:hub-chapters`). The band is `hidden`, never unmounted, so every hub
 * URL stays in every page's HTML; the lists are fragments on their hubs and add no crawl target.
 * See docs/features/header-navigation.md.
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
 * The head of a column: the hub's photo with its name, mark and one line on it, all of it the hub's
 * link. The scrim is weighted to the lower half because the name sits mid-photo and white text
 * needs 4.5 : 1 over the lightest photos. `h-32` at every width, so a narrow column does not push
 * the list down for sky. A missing photo leaves a dark tile under the same scrim.
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
        {/* Two lines reserved whether the hint needs them or not, so the three names stand on one
            line across the band: the text is anchored to the foot of the photo. */}
        <span className="line-clamp-2 min-h-[2lh] text-xs leading-snug text-pretty text-white/85">
          {hint}
        </span>
      </span>
    </Link>
  );
}

/**
 * The rows under a banner, one shape for categories and chapters (the parks panel's country row),
 * so the bands read as one surface. A category's number is a count and stands right; a chapter's
 * is its place in the page and stands first, in the accent. One row height in all three lists, so
 * rows stand level across columns. A chapter label may wrap and a category label may not.
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
  // `navigation` only: a `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes.
  const t = useTranslations('navigation');

  const categories = menu?.glossary.categories ?? [];

  // The same destination gets the same mark wherever it is offered: `CalendarRange` and `BookOpen`
  // as on the homepage's `BlogChapter`, `Compass` as in the bar and the phone sheet.
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
 * Fancast, under the chapters of the hub it serves: the best-time page's crowd calendar is
 * Fancast's forecast. A card with a photo strip that fills the column level with the other two, a
 * rank below the hubs (no name on the photo, no list). The hover is the border, not the label's
 * colour: `text-primary` misses 4.5 : 1 on a 14 px label, while `border-primary` clears the 3 : 1 a
 * border owes.
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
