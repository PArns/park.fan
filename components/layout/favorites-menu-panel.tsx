'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Clock, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { FavoritesHowTo } from '@/components/parks/favorites-how-to';
import { useFavorites } from '@/lib/hooks/use-favorites';
import { useFavoriteCounts, type FavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useMinuteNowDate } from '@/lib/hooks/use-minute-now';
import { formatDurationShort } from '@/lib/i18n/time';
import { FavoriteStar } from '@/components/common/favorite-star';
import { formatDistance } from '@/lib/utils/distance-utils';
import type { NearbyParksData, ParkWithDistance } from '@/types/nearby';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { stripNewPrefix } from '@/lib/utils';
import { translateGeoSlug } from '@/lib/utils/geo-translate';
import {
  buildRestaurantUrl,
  buildShowUrl,
  convertApiUrlToFrontendUrl,
} from '@/lib/utils/url-utils';
import type {
  FavoriteAttraction,
  FavoritePark,
  FavoriteRestaurant,
  FavoriteShow,
} from '@/lib/api/favorites';
import type { AttractionStatus, CrowdLevel, ParkStatus, ScheduleSummary } from '@/lib/api/types';

/**
 * The favorites menu's contents — cards in the full-width band, rows in the 300 px burger sheet.
 *
 * Three things it is built around:
 *
 * 1. **It does not fetch until it is opened.** The header renders on every one of ~35,000 pages;
 *    an ungated `useFavorites()` here would put a `/api/favorites` request on all of them for
 *    every visitor who has ever starred anything. `open` is the gate, and the query key is shared
 *    with the homepage band, so opening the menu there resolves from cache.
 * 2. **Two shapes, because the two hosts are 1100 px apart.** The band gets cards with the photo
 *    the favorites proxy already attaches (`enrichParksWithImages`) and the wait time set large —
 *    that is what somebody opens this for. The sheet gets rows: a card grid in a 300 px column is
 *    one card per screen.
 * 3. **The picture is optional and the layout is not.** The media database holds an image for 14
 *    of 212 parks, so most cards fall back to a tinted field carrying the park's own crowd colour.
 *    Its box is identical either way — a grid that reflows depending on which parks somebody
 *    happens to have starred reads as broken.
 *
 * Everything here reads `favorites`, `common`, `geo` and `parks.status`, all of which the layout
 * chrome already carries. `ParkCard`/`AttractionCard` would drag `parks` + `attractions` into the
 * chrome payload of every page, which is what the homepage band fetches a lazy chunk to avoid.
 */

/**
 * The most cards a group may ever show, however wide the band is.
 *
 * The band's own limit is `MAX_CARD_ROWS` rows of whatever columns `planBand` gave the group,
 * which is almost always the smaller of the two; this is the ceiling over it — a cap on how much
 * of the menu one group may take, not a column count.
 */
const MAX_CARDS = 8;
/** Rows per group in the sheet, where they are cheaper. */
const MAX_ROWS = 5;

/**
 * The band's card track, in pixels, and the numbers the allocation below is built out of.
 *
 * `CARD_MIN` is the width at which a card still says what it is: under it the second line stops
 * being a place name and becomes an ellipsis. `CARD_MAX` is the other end — two starred parks in
 * a 1248 px band must not become two 600 px billboards.
 *
 * The two gaps differ on purpose: cards inside a group belong together, groups do not.
 */
const CARD_MIN = 168; // 10.5rem
const CARD_MAX = 248; // 15.5rem
const CARD_GAP = 12; // gap-3
const GROUP_GAP = 32; // gap-8
/** Rows are rows: extra width only makes one longer, so this group gets a slice and no more. */
const VENUE_BASIS = 208; // 13rem
/** Card rows a group may take before the rest goes behind the "+N" line. */
const MAX_CARD_ROWS = 2;
/**
 * Below this the band is too narrow for two groups beside each other and they stack.
 *
 * A floor rather than a breakpoint: the nav row that holds this trigger is itself gone below a
 * 1024 px header, so the narrowest band anybody can open is 992 px and nothing today reaches
 * this. It is here so that a future change to the header's tiers degrades into a column instead
 * of into a row that does not fit.
 */
const STACK_BELOW = 2 * CARD_MIN + CARD_GAP + GROUP_GAP + VENUE_BASIS;

/** Parks offered for one-tap starring while the list is still empty. */
const SUGGESTION_LIMIT = 5;

/** The tint a card without a photo gets, from the park's own crowd level. Full class names. */
const CROWD_FIELD: Record<string, string> = {
  very_low: 'from-crowd-very-low/25',
  low: 'from-crowd-low/25',
  moderate: 'from-crowd-moderate/25',
  high: 'from-crowd-high/25',
  very_high: 'from-crowd-very-high/25',
  extreme: 'from-crowd-extreme/25',
};

function standbyWait(attraction: FavoriteAttraction): number | null {
  const standby = attraction.queues?.find((q) => q.queueType === 'STANDBY');
  return standby?.waitTime ?? null;
}

/** The wait time as the card's headline figure — the reason somebody opened this menu. */
function WaitFigure({ minutes, unit }: { minutes: number; unit: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span
        className={`text-2xl leading-none font-bold tabular-nums ${CROWD_TEXT_CLASS[waitTimeCrowdTier(minutes)]}`}
      >
        {minutes}
      </span>
      <span className="text-muted-foreground text-[11px]">{unit}</span>
    </span>
  );
}

/**
 * One favorite as a card: picture on top, name and place under it, the figure in the footer.
 *
 * **Every card in this panel is exactly as tall as every other one, and none of that height
 * depends on what the API answered.** The picture height is FIXED rather than an aspect ratio:
 * back when the two groups had columns of different widths, `aspect-[16/10]` made the picture
 * follow that width and a park card stood 27 px taller than the ride card beside it before a
 * single line of text was drawn. `planBand` gives every group the same card width now, so that
 * particular fault cannot recur — but a fixed height is still what keeps the band's rows level
 * when the card width changes between breakpoints, and `object-cover` fills the box either way
 * with the focal point holding.
 *
 * The text block underneath is reserved rather than conditional, for the same reason and for a
 * second one: within a group it made rows ragged too. A ride with no wait time rendered no
 * figure at all (32 px shorter), a closed park's `0/64` is a `text-xs` line where an open one has
 * a `text-2xl` one (8 px), and a ride whose park is unknown dropped its subtitle. So the
 * subtitle, the figure and the schedule each get a box of their own whether or not there is
 * anything to put in it.
 */
function Card({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  crowd,
  figure,
  schedule,
  badge,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  crowd?: CrowdLevel | null;
  figure?: React.ReactNode;
  schedule?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const tint = crowd && crowd !== 'unknown' ? CROWD_FIELD[crowd] : null;

  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="group border-border/60 bg-card/40 hover:border-primary/40 flex h-full flex-col overflow-hidden rounded-xl border transition-colors"
      >
        <span className="bg-muted relative block h-32 shrink-0 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt=""
              fill
              sizes="(min-width: 1280px) 220px, 180px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={{ objectPosition: imagePosition }}
            />
          ) : (
            <span
              className={`absolute inset-0 bg-gradient-to-br to-transparent ${tint ?? 'from-primary/15'}`}
              aria-hidden="true"
            />
          )}
          {badge && <span className="absolute top-2 right-2">{badge}</span>}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5 p-3">
          <span className="text-foreground group-hover:text-primary truncate text-sm font-semibold transition-colors">
            {title}
          </span>
          {/* Leer heißt leer, nicht weg — siehe oben. Das Geviert hält die Zeile offen. */}
          <span className="text-muted-foreground truncate text-xs">{subtitle || '\u00A0'}</span>
          {/* `h-6` ist die Höhe von `WaitFigure` (text-2xl, leading-none), damit die kleinere
              Ersatzangabe darin sitzt statt die Karte kürzer zu machen. */}
          <span className="mt-1.5 flex h-6 items-center">{figure}</span>
          <span className="mt-1 flex h-4 items-center">{schedule}</span>
        </span>
      </Link>
    </li>
  );
}

/**
 * „Schließt in 3 Std. 12 Min." / „Öffnet in 40 Min." / „Öffnet am Fr., 5. Sept." für eine
 * Favoritenkarte.
 *
 * Rein und ohne Uhr: `now` kommt von außen, damit die Funktion testbar bleibt und der Aufrufer
 * entscheidet, wann sie überhaupt eine Antwort geben darf. Vor dem Mount ist `now` `null` und
 * hier kommt `null` heraus — die Zeile ist dann leer, aber ihr Kasten steht (siehe `Card`), also
 * kostet das Nachrücken nichts.
 *
 * Der Status des Parks wird bewusst nicht gelesen, nur der Fahrplan und die Uhr in der Zeitzone
 * des Parks: `status` ist die Live-Lage („gerade außerplanmäßig zu"), die Frage hier ist aber,
 * wann laut Plan auf- und zugeschlossen wird. Beides nebeneinander widerspricht sich nicht — das
 * Badge auf dem Bild sagt das eine, diese Zeile das andere.
 */
function scheduleMessage(
  {
    todaySchedule,
    nextSchedule,
    timezone,
  }: {
    todaySchedule?: ScheduleSummary;
    nextSchedule?: ScheduleSummary;
    timezone?: string;
  },
  now: Date | null,
  t: (key: string) => string,
  tCommon: (key: string, values?: Record<string, string | number | Date>) => string,
  locale: string
): string | null {
  if (!now) return null;

  const tz = timezone ? { timeZone: timezone } : {};
  const dayIn = (d: Date) => d.toLocaleDateString('en-CA', tz);

  try {
    if (todaySchedule?.scheduleType === 'OPERATING') {
      const opening = new Date(todaySchedule.openingTime);
      const closing = new Date(todaySchedule.closingTime);
      // Der Eintrag heißt „today", muss es aber in der Zeitzone des Parks auch sein: für einen
      // Park in Kalifornien ist der 2. September hier schon der 1. dort.
      if (dayIn(opening) === dayIn(now)) {
        if (now < opening) {
          return `${t('opensIn')} ${formatDurationShort(opening.getTime() - now.getTime(), tCommon)}`;
        }
        if (now < closing) {
          return `${t('closesIn')} ${formatDurationShort(closing.getTime() - now.getTime(), tCommon)}`;
        }
      }
    }

    if (nextSchedule?.scheduleType !== 'OPERATING') return null;
    const next = new Date(nextSchedule.openingTime);
    const diff = next.getTime() - now.getTime();
    if (diff <= 0) return null;
    // Unter einem Tag zählt die Restzeit, darüber das Datum: „öffnet in 62 Std." ist keine
    // Angabe, mit der jemand etwas anfangen kann.
    if (diff < 24 * 60 * 60 * 1000) {
      return `${t('opensIn')} ${formatDurationShort(diff, tCommon)}`;
    }
    return `${t('opensOn')} ${next.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...tz,
    })}`;
  } catch {
    return null;
  }
}

/**
 * Die Fahrplanzeile unter der Kennzahl.
 *
 * `suppressHydrationWarning`, weil der Text an der Uhr des Lesers hängt; `useMinuteNowDate` gibt
 * vor dem Mount `null` zurück, der erste Client-Render stimmt also mit dem Server überein und die
 * Zeile füllt sich eine Tick später.
 */
function ScheduleLine({
  todaySchedule,
  nextSchedule,
  timezone,
}: {
  todaySchedule?: ScheduleSummary;
  nextSchedule?: ScheduleSummary;
  timezone?: string;
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const now = useMinuteNowDate();

  const message = scheduleMessage(
    { todaySchedule, nextSchedule, timezone },
    now,
    t,
    tCommon,
    locale
  );
  if (!message) return null;

  return (
    <span
      className="text-muted-foreground flex min-w-0 items-center gap-1 text-[11px]"
      suppressHydrationWarning
    >
      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{message}</span>
    </span>
  );
}

/** The sheet's shape: thumbnail, two lines, the figure on the right. */
function Row({
  href,
  title,
  subtitle,
  image,
  imagePosition,
  trailing,
}: {
  href: string;
  title: string;
  subtitle?: string | null;
  image?: string | null;
  imagePosition?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        prefetch={false}
        className="hover:bg-muted/60 -mx-2 flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors"
      >
        {/* The box is always drawn, picture or not: a row that indents depending on which park it
            is reads as a rendering fault. */}
        <span className="bg-muted relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg">
          {image && (
            <Image
              src={image}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-foreground block truncate text-sm font-medium">{title}</span>
          {subtitle && (
            <span className="text-muted-foreground block truncate text-xs">{subtitle}</span>
          )}
        </span>
        {trailing && <span className="shrink-0 text-right">{trailing}</span>}
      </Link>
    </li>
  );
}

function GroupHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="text-foreground border-border/60 mb-2.5 flex items-center justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase">
      <span>{title}</span>
      <span className="text-muted-foreground/70 tabular-nums">{count}</span>
    </div>
  );
}

function CardSkeletons({ count }: { count: number }) {
  return (
    <>
      {/* Dieselben Kästen wie in `Card`, sonst springt das Band beim Eintreffen der Daten. Die
          Anzahl kommt fertig gedeckelt herein — das Skelett muss dieselben Reihen belegen wie
          die Karten danach, und wie viele das sind, weiß nur die Aufteilung des Bandes. */}
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="border-border/60 overflow-hidden rounded-xl border">
          <Skeleton className="h-32 rounded-none" />
          <div className="p-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-0.5 h-4 w-20" />
            <Skeleton className="mt-1.5 h-6 w-12" />
            <Skeleton className="mt-1 h-4 w-24" />
          </div>
        </li>
      ))}
    </>
  );
}

function RowSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: Math.min(count, MAX_ROWS) }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <span className="min-w-0 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1 h-3 w-16" />
          </span>
        </li>
      ))}
    </>
  );
}

/**
 * How the band divides itself up, in pixels, once it has been measured.
 *
 * **Every card in the panel is the same width, and that is what this exists to guarantee.** It
 * used to give each group `flexGrow: <its card count>` and then fill that width with
 * `repeat(auto-fill, minmax(10.5rem, 1fr))` — the width followed the count, the column count
 * followed the width, and the quantization in between broke the proportion it was built on.
 * Three starred parks beside five rides got 336 px, which is 12 px short of two 168 px columns,
 * so the parks group drew ONE column of 336 px cards and stacked all three: park cards at twice
 * the width of the ride cards beside them, and a menu band 868 px tall — taller than the window
 * it hangs in — for eight favorites.
 *
 * So the tracks are laid out first and the groups are cut from them. The band is measured, the
 * card width is derived from it once, and each group gets a whole number of those cards. What a
 * group cannot show in `MAX_CARD_ROWS` rows goes behind the "+N" line it already had, which is
 * what keeps the panel's height bounded no matter how much somebody has starred.
 */
interface BandPlan {
  /** Groups under each other instead of beside each other — the band is too narrow for a row. */
  stacked: boolean;
  /** The width of one card. The same number in every group. */
  card: number;
  /** Card columns per group. */
  parks: number;
  attractions: number;
}

/**
 * Hands `total` tracks to the groups: one each, then always to whoever is most crowded.
 *
 * Greedy on `wanted / (has + 1)`, so five rides outbid three parks for the fourth track and the
 * split lands on the counts rather than on a rounded percentage. A group never gets more tracks
 * than it has cards — a spare track would draw an empty column, and the group beside it can use
 * the room.
 */
function shareTracks(total: number, wanted: number[]): number[] {
  const cols: number[] = wanted.map((w) => (w > 0 ? 1 : 0));
  let left = total - cols.reduce((a, b) => a + b, 0);

  while (left > 0) {
    let best = -1;
    let bestScore = 0;
    wanted.forEach((want, i) => {
      if (cols[i] >= want) return;
      const score = want / (cols[i] + 1);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) break;
    cols[best] += 1;
    left -= 1;
  }

  return cols;
}

/** `null` until the band has a width — before the first layout pass there is nothing to divide. */
function planBand(width: number, counts: FavoriteCounts): BandPlan | null {
  if (width <= 0) return null;

  const wanted = [Math.min(counts.parks, MAX_CARDS), Math.min(counts.attractions, MAX_CARDS)];
  const cardGroups = wanted.filter((w) => w > 0).length;
  const venues = counts.shows + counts.restaurants > 0;
  const groups = cardGroups + (venues ? 1 : 0);
  const stacked = groups > 1 && width < STACK_BELOW;

  if (cardGroups === 0) return { stacked, card: 0, parks: 0, attractions: 0 };

  // What the cards may spend. Stacked, each group has the band to itself on its own line, so the
  // group gaps and the venue slice come out of nothing.
  const forCards = stacked ? width : width - (groups - 1) * GROUP_GAP - (venues ? VENUE_BASIS : 0);
  const sharers = stacked ? 1 : cardGroups;
  const tracks = Math.max(sharers, Math.floor((forCards + CARD_GAP) / (CARD_MIN + CARD_GAP)));
  const cols = stacked ? wanted.map((w) => (w > 0 ? tracks : 0)) : shareTracks(tracks, wanted);

  // Off the tracks actually handed out, not off the tracks that fit: two favorites should use the
  // room the other six would have taken rather than leave it blank — up to `CARD_MAX`, past which
  // a card in a menu turns into a billboard. `floor`, so a rounded-up sub-pixel cannot push the
  // last column out of a group whose width the same numbers computed.
  const used = stacked ? tracks : cols.reduce((a, b) => a + b, 0);
  const card = Math.floor(Math.min(CARD_MAX, (forCards - (used - sharers) * CARD_GAP) / used));

  return { stacked, card, parks: cols[0], attractions: cols[1] };
}

/**
 * The band's inner width, measured.
 *
 * There is no way around measuring: the number of cards that fit is a function of the width, the
 * width of the header is a function of the trip planner, and the split between the groups has to
 * be decided before either grid is drawn. It runs in a LAYOUT effect keyed on `open`, so the
 * measurement happens in the same commit that drops the panel's `hidden` — the first painted
 * frame is already the right one, and the observer only catches what changes afterwards (the
 * planner opening, a window resize).
 */
function useBandWidth(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const read = () => setWidth(el.getBoundingClientRect().width);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [active]);

  return { ref, width };
}

export function FavoritesMenuPanel({
  open,
  variant = 'band',
}: {
  open: boolean;
  /**
   * `band` is the full-width header panel, `sheet` the 300 px burger column.
   *
   * Not cosmetic: every `sm:`/`lg:` below is a VIEWPORT query, and the sheet is 300 px wide at
   * every viewport that shows it — including 640–1023 px, where the burger is still the whole
   * navigation.
   */
  variant?: 'band' | 'sheet';
}) {
  const t = useTranslations('favorites');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const tNav = useTranslations('navigation');
  const counts = useFavoriteCounts();
  // `poll: false` — the menu is on screen for seconds. The homepage band is the surface that
  // stays open long enough for a five-minute refresh to mean anything, and it keeps its own.
  const { data, isPending } = useFavorites({ enabled: open && counts.total > 0, poll: false });
  const minuteLabel = tCommon('minuteShort');
  const isSheet = variant === 'sheet';
  // Band only: the sheet is 300 px wide wherever it is shown and has nothing to divide.
  const { ref: bandRef, width: bandWidth } = useBandWidth(open && !isSheet && counts.total > 0);

  /*
   * Vorschläge für den leeren Zustand.
   *
   * Dieselbe Query, die der Header für die „In der Nähe"-Pille und das Parkmenü ohnehin stellt —
   * keine zusätzliche Anfrage. `useMounted` ist Pflicht und kein Feinschliff: der Hook seedet aus
   * `localStorage`, ohne das Gatter stünde serverseitig keine Zeile und im ersten Client-Render
   * eine, und React würde den Teilbaum wegwerfen (siehe #360).
   */
  const mounted = useMounted();
  const { data: nearbyData } = useHomeNearbyParks();
  const suggestions =
    mounted && nearbyData?.type === 'nearby_parks'
      ? (nearbyData.data as NearbyParksData).parks.slice(0, isSheet ? 3 : SUGGESTION_LIMIT)
      : [];
  const more = (hidden: number) => t('more', { count: hidden });

  if (counts.total === 0) {
    /*
     * In the sheet two lines, in the band the whole guide.
     *
     * The three steps stacked in a 300 px column are 358 px tall — 58 % of the entire burger menu
     * on a 390×844 phone, for a state with nothing to show. That menu is the whole navigation
     * there. The sentence that matters is the second step anyway: where the star is.
     */
    if (isSheet) {
      return (
        <div data-menu-stagger className="flex gap-3">
          <Star className="text-muted-foreground/60 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0">
            <span className="text-foreground block text-sm font-semibold">{t('empty')}</span>
            <span className="text-muted-foreground block text-xs leading-relaxed">
              {t('howTo.starText')}
            </span>
          </span>
        </div>
      );
    }

    /*
     * Der leere Zustand ist DASSELBE Panel, nur ohne Inhalt — und sah aus wie ein anderes.
     *
     * Er stand mittig, mit `max-w-3xl` darunter: ein 768-px-Block, der in einem 1248 px breiten
     * Band bei x=336 anfing und bei 1104 aufhörte, während die Navigationszeile darüber, die
     * Karten des gefüllten Zustands und die Seite darunter alle bei 96 beginnen. Eine Insel, die
     * sich an nichts ausrichtet, mit je einem Viertel leerem Glas links und rechts. Dazu eine
     * andere Kopfzeile als der gefüllte Zustand — dort links „★ Favoriten" und rechts „Alle
     * anzeigen", hier eine zentrierte Zeile ohne Gegenstück —, sodass ein Besucher ohne
     * Favoriten nicht dasselbe Menü sieht wie einer mit.
     *
     * Die Begründung fürs Zentrieren war „linksbündig bliebe rechts eine leere Hälfte". Die
     * bleibt zentriert auch — nur in zwei Vierteln statt in einer Hälfte, und dafür an keiner
     * Kante. Also dieselbe Kopfzeile, dieselben Kanten, und die drei Schritte über die volle
     * Breite als drei Spalten: bei 1248 px sind das ~400 px pro Schritt für ein bis zwei Zeilen,
     * was liest, statt quer über den Bildschirm zu laufen.
     */
    return (
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          {/* Grau, nicht gold: der Stern im Auslöser ist gefüllt, sobald etwas markiert ist, und
              diese Zeile sagt das Gegenteil. */}
          <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <Star className="text-muted-foreground/60 h-4 w-4" aria-hidden="true" />
            {t('empty')}
          </span>
          {/* Wo im gefüllten Zustand „Alle anzeigen" steht. Als Knopf unter der Anleitung nahm
              derselbe Link eine eigene Zeile im Band und stand wieder auf keiner Kante. */}
          <Link
            href="/parks"
            prefetch={false}
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            {tNav('explore')}
          </Link>
        </div>

        <div data-menu-stagger>
          <FavoritesHowTo cta={false} />
        </div>

        {suggestions.length > 0 && (
          <div data-menu-stagger className="border-border/60 mt-5 border-t pt-4">
            <span className="text-muted-foreground mb-2.5 block text-[11px] font-semibold tracking-wide uppercase">
              {tNav('nearby')}
            </span>
            {/* Der Stern steht NEBEN dem Link, nicht darin: verschachtelt würde ein Klick darauf
                zur Parkseite navigieren, statt den Park zu markieren. Genau das ist hier aber der
                Sinn — ein Tippen, und das Panel füllt sich. */}
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((park) => (
                <SuggestionChip key={park.id} park={park} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const loading = isPending || !data;
  const cap = isSheet ? MAX_ROWS : MAX_CARDS;
  /*
   * „Alle anzeigen" nur, wenn es etwas zu sehen gibt, das hier nicht steht.
   *
   * Der Link stand immer da, auch wenn drei Favoriten in ein Band mit Platz für sechzehn passen —
   * dann führt er auf eine Seite, die exakt dasselbe zeigt. Sichtbar wird er, wenn eine Gruppe
   * über ihre Obergrenze läuft oder wenn Shows und Restaurants dabei sind: die rendert dieses
   * Panel als eigene Gruppe, aber ohne Bild und Kennzahl, und die Startseite zeigt sie
   * vollständig.
   *
   * Wie viele Karten eine Gruppe zeigt, entscheidet jetzt die Aufteilung des Bandes (`planBand`)
   * und nicht mehr eine feste Zahl: so viele, wie in `MAX_CARD_ROWS` Reihen ihrer Spalten
   * passen. Damit hängt die Höhe des Bandes an der Anzahl der REIHEN statt daran, wie viel
   * jemand markiert hat — der Rest fällt in dieselbe „+N"-Zeile.
   */
  const plan = isSheet ? null : planBand(bandWidth, counts);
  const cardCap = (cols: number | undefined, count: number) =>
    Math.min(count, MAX_CARDS, Math.max(1, cols ?? MAX_CARDS) * MAX_CARD_ROWS);
  const parkCap = isSheet ? MAX_ROWS : cardCap(plan?.parks, counts.parks);
  const attractionCap = isSheet ? MAX_ROWS : cardCap(plan?.attractions, counts.attractions);

  const hiddenParks = Math.max(0, counts.parks - parkCap);
  const hiddenAttractions = Math.max(0, counts.attractions - attractionCap);
  const hiddenVenues = Math.max(0, counts.shows + counts.restaurants - cap);
  const somethingHidden = hiddenParks + hiddenAttractions + hiddenVenues > 0;

  const listClass = isSheet ? 'space-y-px' : 'grid gap-3';
  /*
   * Feste Pixelspuren, kein `1fr`: die Kartenbreite ist EINE Zahl für das ganze Band, und ein
   * `fr` würde sie in jeder Gruppe neu aus deren Breite ableiten — genau der Rückweg zu zwei
   * Kartengrößen nebeneinander. Ohne Messung fällt es auf `auto-fill` zurück, das ist nur für
   * den einen Renderdurchgang vor dem ersten Layout da.
   */
  const gridStyle = (cols: number | undefined): React.CSSProperties | undefined => {
    if (isSheet) return undefined;
    if (!plan || !cols) return { gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))' };
    return { gridTemplateColumns: `repeat(${cols}, ${plan.card}px)` };
  };
  /* Die Gruppe ist so breit wie ihre Spuren; ihre Breite ist ein Ergebnis, keine Vorgabe mehr. */
  const groupStyle: React.CSSProperties | undefined = isSheet ? undefined : { flex: '0 0 auto' };
  /*
   * Shows und Restaurants wachsen NICHT mit ihrer Anzahl.
   *
   * Karten brauchen mehr Breite, wenn es mehr werden; eine Zeile wird davon nur länger, nicht
   * besser: vier Shows hätten sich sonst ein Drittel des Bandes genommen und es rechts leer
   * stehen lassen. Eine feste Grundbreite, die den Rest nur mitnimmt, wenn keine andere Gruppe
   * ihn braucht — und die volle Breite, wenn sie als einzige da ist.
   */
  const venueStyle: React.CSSProperties | undefined =
    isSheet || !plan || plan.stacked
      ? undefined
      : { flexGrow: 1, flexShrink: 1, flexBasis: `${VENUE_BASIS}px`, minWidth: 0 };

  return (
    <div ref={bandRef}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-foreground inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
          {/* Gold wie der Auslöser im Balken und wie jeder Stern auf einer Park- oder Bahnseite
              (`FavoriteStar`) — dieselbe Marke, dieselbe Farbe. */}
          <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
          {t('title')}
        </span>
        {somethingHidden && (
          <Link
            href="/#favorites"
            prefetch={false}
            className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
          >
            {tCommon('viewAll')}
          </Link>
        )}
      </div>

      {/* `plan.stacked` und nicht `lg:flex-row`: die Breite dieses Bandes ist die des Headers,
          und die schrumpft der Tagesplaner, ohne dass das Fenster sich rührt — eine
          Viewport-Regel beschreibt hier nicht mehr den Kasten, in dem sie steht. */}
      <div
        className={
          isSheet ? 'space-y-5' : `flex ${plan && !plan.stacked ? 'gap-8' : 'flex-col gap-6'}`
        }
      >
        {counts.parks > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle}>
            <GroupHeading title={t('parks')} count={counts.parks} />
            <ul className={listClass} style={gridStyle(plan?.parks)}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.parks} />
                ) : (
                  <CardSkeletons count={parkCap} />
                )
              ) : (
                <>
                  {data.parks.slice(0, parkCap).map((park) => (
                    <ParkEntry
                      key={park.id}
                      park={park}
                      isSheet={isSheet}
                      minuteLabel={minuteLabel}
                      country={translateGeoSlug(tGeo, 'countries', park.country, park.country)}
                    />
                  ))}
                  <MoreLine
                    hidden={counts.parks - Math.min(data.parks.length, parkCap)}
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}

        {counts.attractions > 0 && (
          <div data-menu-stagger className="min-w-0" style={groupStyle}>
            <GroupHeading title={t('attractions')} count={counts.attractions} />
            <ul className={listClass} style={gridStyle(plan?.attractions)}>
              {loading ? (
                isSheet ? (
                  <RowSkeletons count={counts.attractions} />
                ) : (
                  <CardSkeletons count={attractionCap} />
                )
              ) : (
                <>
                  {data.attractions.slice(0, attractionCap).map((attraction) => (
                    <AttractionEntry
                      key={attraction.id}
                      attraction={attraction}
                      isSheet={isSheet}
                      minuteLabel={minuteLabel}
                    />
                  ))}
                  <MoreLine
                    hidden={counts.attractions - Math.min(data.attractions.length, attractionCap)}
                    label={more}
                  />
                </>
              )}
            </ul>
          </div>
        )}

        {/* Shows und Restaurants stehen in DIESER Reihe, nicht in der Kopfzeile.
            Dort standen sie: im `flex items-center justify-between` neben Überschrift und
            „Alle anzeigen", also als dritte Spalte einer Titelleiste, vertikal zentriert und
            32 px hoch gequetscht. Sie sind eine Gruppe wie Parks und Attraktionen und gehören
            neben sie — nur eben als Zeilen, siehe `venueRows`. */}
        {counts.shows + counts.restaurants > 0 && (
          <div data-menu-stagger className="min-w-0" style={venueStyle}>
            <GroupHeading
              title={counts.shows > 0 ? t('shows') : t('restaurants')}
              count={counts.shows + counts.restaurants}
            />
            <ul className="space-y-px">
              {loading ? (
                <RowSkeletons count={counts.shows + counts.restaurants} />
              ) : (
                <>
                  {venueRows(data.shows, data.restaurants)
                    .slice(0, cap)
                    .map((venue) => (
                      <Row
                        key={venue.id}
                        href={venue.href}
                        title={venue.title}
                        subtitle={venue.park}
                      />
                    ))}
                  <MoreLine hidden={hiddenVenues} label={more} />
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function MoreLine({ hidden, label }: { hidden: number; label: (n: number) => string }) {
  if (hidden <= 0) return null;
  return (
    <li className="col-span-full px-2 pt-1">
      <Link
        href="/#favorites"
        prefetch={false}
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {label(hidden)}
      </Link>
    </li>
  );
}

function ParkEntry({
  park,
  isSheet,
  minuteLabel,
  country,
}: {
  park: FavoritePark;
  isSheet: boolean;
  minuteLabel: string;
  country: string;
}) {
  const href = convertApiUrlToFrontendUrl(park.url);
  const title = stripNewPrefix(park.name);
  const operating = park.status === 'OPERATING';
  // Ø and crowd only for a park that is actually running: a closed one aggregates over an empty
  // set and reports the same thing a park with no wait-time source reports.
  const wait =
    operating && park.analytics?.avgWaitTime != null
      ? roundWaitTo5(park.analytics.avgWaitTime)
      : null;
  const badge = (
    <ParkStatusBadge status={park.status as ParkStatus} className="px-1.5 py-0 text-[10px]" />
  );

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={[park.city, country].filter(Boolean).join(' · ')}
        image={park.backgroundImage}
        imagePosition={park.backgroundPosition}
        trailing={
          wait !== null ? (
            <span className="text-sm font-semibold tabular-nums">
              <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
              <span className="text-muted-foreground ml-1 text-xs font-normal">{minuteLabel}</span>
            </span>
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={[park.city, country].filter(Boolean).join(' · ')}
      image={park.backgroundImage}
      imagePosition={park.backgroundPosition}
      crowd={operating ? park.analytics?.crowdLevel : null}
      badge={badge}
      schedule={
        <ScheduleLine
          todaySchedule={park.todaySchedule}
          nextSchedule={park.nextSchedule}
          timezone={park.timezone}
        />
      }
      figure={
        wait !== null ? (
          <WaitFigure minutes={wait} unit={minuteLabel} />
        ) : (
          <span className="text-muted-foreground text-xs">
            {park.operatingAttractions != null
              ? `${park.operatingAttractions}/${park.totalAttractions}`
              : `${park.totalAttractions}`}
          </span>
        )
      }
    />
  );
}

function AttractionEntry({
  attraction,
  isSheet,
  minuteLabel,
}: {
  attraction: FavoriteAttraction;
  isSheet: boolean;
  minuteLabel: string;
}) {
  const href = convertApiUrlToFrontendUrl(attraction.url);
  const title = stripNewPrefix(attraction.name);
  const parkName = attraction.park ? stripNewPrefix(attraction.park.name) : null;
  // `effectiveStatus`, never the raw `status`: a ride out of season is closed, and the raw field
  // does not know that. See `docs/api/seasonal-attractions.md`.
  const status = (attraction.effectiveStatus ?? attraction.status ?? 'CLOSED') as AttractionStatus;
  const operating = status === 'OPERATING';
  const raw = standbyWait(attraction);
  const wait = operating && raw !== null ? roundWaitTo5(raw) : null;
  const badge = <ParkStatusBadge status={status} className="px-1.5 py-0 text-[10px]" />;

  if (isSheet) {
    return (
      <Row
        href={href}
        title={title}
        subtitle={parkName}
        image={attraction.backgroundImage}
        imagePosition={attraction.backgroundPosition}
        trailing={
          wait !== null ? (
            <span className="text-sm font-semibold tabular-nums">
              <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
              <span className="text-muted-foreground ml-1 text-xs font-normal">{minuteLabel}</span>
            </span>
          ) : (
            badge
          )
        }
      />
    );
  }

  return (
    <Card
      href={href}
      title={title}
      subtitle={parkName}
      image={attraction.backgroundImage}
      imagePosition={attraction.backgroundPosition}
      crowd={operating ? attraction.crowdLevel : null}
      badge={badge}
      figure={wait !== null ? <WaitFigure minutes={wait} unit={minuteLabel} /> : null}
    />
  );
}

/**
 * Shows und Restaurants in einer Gruppe, als Zeilen.
 *
 * Sie bekommen keine Karte: die Mediendatenbank hat für keinen von beiden ein Bild, und eine
 * Kennzahl gibt es auch nicht — eine Karte wäre eine leere Fläche mit einem Namen darin. Beide
 * haben zudem keine eigene Seite; sie leben auf der Parkseite unter ihrem Reiter, weshalb der
 * Link dorthin geht.
 *
 * Der Grund, warum es diese Gruppe überhaupt (wieder) gibt: der Umbau auf Karten hat sie
 * herausgeworfen, und wer nur eine Show markiert hatte, öffnete danach ein leeres Menü mit einer
 * Zahl am Stern.
 */
function venueRows(shows: FavoriteShow[], restaurants: FavoriteRestaurant[]) {
  const parkHref = (url: string | undefined) => {
    if (!url) return null;
    const converted = convertApiUrlToFrontendUrl(url);
    return converted !== '#' && converted.startsWith('/parks/') ? converted : null;
  };

  return [
    ...shows.map((show) => ({
      id: show.id,
      title: stripNewPrefix(show.name),
      park: show.park ? stripNewPrefix(show.park.name) : null,
      base: parkHref(show.url),
      build: buildShowUrl,
    })),
    ...restaurants.map((restaurant) => ({
      id: restaurant.id,
      title: stripNewPrefix(restaurant.name),
      park: restaurant.park ? stripNewPrefix(restaurant.park.name) : null,
      base: parkHref(restaurant.url),
      build: buildRestaurantUrl,
    })),
  ].map((v) => ({
    id: v.id,
    title: v.title,
    park: v.park,
    // Ohne auflösbare Parkseite bleibt das Favoritenband der Startseite der einzige Ort, an dem
    // der Eintrag noch zu sehen ist.
    href: v.base ? v.build(v.base) : '/#favorites',
  }));
}

/**
 * Ein Parkvorschlag: antippbar zum Öffnen, mit einem Stern daneben zum Markieren.
 *
 * Der leere Zustand erklärt bisher, wo der Stern sitzt — und schickt den Leser damit weg, um ihn
 * zu suchen. Die Parks in Reichweite stehen ohnehin schon in der Antwort, die der Header für
 * seine Pille holt; sie hier anzubieten macht aus der Anleitung eine Handlung.
 */
function SuggestionChip({ park }: { park: ParkWithDistance }) {
  return (
    /* Links 1, rechts 2.5: die Pille ist `rounded-full`, ihr Rand krümmt sich also nach außen.
       Links füllt das runde Bild die Höhe und sitzt satt in der Krümmung; rechts steht ein 16-px-
       Stern in der Mitte, und mit denselben 4 px klebte er am Rand. */
    <li className="border-border/70 bg-card/40 hover:border-primary/40 flex items-center gap-1 rounded-full border py-1 pr-2.5 pl-1 transition-colors">
      <Link
        href={convertApiUrlToFrontendUrl(park.url) as '/'}
        prefetch={false}
        className="group flex min-w-0 items-center gap-2 pr-1"
      >
        <span className="bg-muted relative block h-6 w-6 shrink-0 overflow-hidden rounded-full">
          {park.backgroundImage && (
            <Image
              src={park.backgroundImage}
              alt=""
              fill
              sizes="24px"
              className="object-cover"
              style={{ objectPosition: park.backgroundPosition }}
            />
          )}
        </span>
        <span className="text-foreground group-hover:text-primary truncate text-[13px] font-medium transition-colors">
          {stripNewPrefix(park.name)}
        </span>
        <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
          {formatDistance(park.distance)}
        </span>
      </Link>
      <FavoriteStar type="park" id={park.id} name={park.name} size="sm" />
    </li>
  );
}
