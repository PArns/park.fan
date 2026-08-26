'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { LocalTime } from '@/components/ui/local-time';
import { WaitTimeValue } from '@/components/common/wait-time-value';
import { formatDurationShort } from '@/lib/i18n/time';
import { useBrowserNow } from '@/lib/hooks/use-mounted';
import { getAttractionDisplayStatus, getStandbyWait } from '@/lib/utils/park-utils';
import { hasReadableWaitTimes } from '@/lib/utils/live-wait-times';
import { isInSeason } from '@/lib/utils/season';
import { stripNewPrefix } from '@/lib/utils';
import type { ParkWithAttractions } from '@/lib/api/types';

/** Rows a column ever shows. Three fits the header band without a scroll and without
 *  turning the fold into a list page. */
const MAX_ROWS = 3;

interface ParkTodayHighlightsProps {
  park: ParkWithAttractions;
  parkPath: string;
  className?: string;
}

/** Caption above a column — the stats band's caption, same size and tracking. */
function Caption({ icon: Icon, children }: { icon: typeof Crown; children: React.ReactNode }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {children}
    </span>
  );
}

/**
 * The two things the fold was missing: when the next shows start, and what the headliners cost
 * right now.
 *
 * Everything else a visitor asks on arrival was already up here — status, hours, crowd now,
 * today's forecast, the holiday context. These two lived in the tabs, several screens down, so
 * the answer to "what do I walk to first" was below the thing it was meant to inform.
 *
 * **The row COUNT comes from the snapshot, the row CONTENT from the live poll.** That split is
 * the whole layout: how many shows a park runs and which rides it classes as headliners are
 * day-stable and already in the first HTML, while the next start time, the wait and whether a
 * ride is open right now all move on the 5-minute poll. So a column reserves its rows once and
 * a ride that shuts mid-afternoon leaves a dash behind instead of collapsing the band and
 * everything under it. A column that has nothing to reserve renders nothing at all — a park
 * with no shows gets no empty shows column, the same call `NearbyParksSection` makes.
 *
 * The headliner column needs no clock — a standby wait is a reading, not a countdown — so it
 * server-renders in full and reaches a crawler with every headliner's name, its wait and the
 * link to its page. Only the shows column asks what time it is, and it asks through
 * `useBrowserNow` rather than reading the clock in render: that keeps the component pure, keeps
 * the server and first client render identical (no `suppressHydrationWarning` needed), and
 * re-ticks the countdown every minute on a tab somebody left open.
 */
export function ParkTodayHighlights({ park, parkPath, className }: ParkTodayHighlightsProps) {
  const t = useTranslations('parks');
  const tCommon = useTranslations('common');

  const waitsReadable = hasReadableWaitTimes(park);

  // Reserved slots — derived ONLY from what the server render already knew. `shows` and the
  // `isHeadliner` flag come with the structure fetch and the live merge carries them, so these
  // two numbers are the same before and after every poll.
  const showSlots = useMemo(
    () =>
      Math.min(
        MAX_ROWS,
        (park.shows ?? []).filter((s) => isInSeason(s) && (s.showtimes?.length ?? 0) > 0).length
      ),
    [park.shows]
  );
  const headlinerSlots = useMemo(
    () =>
      waitsReadable
        ? Math.min(
            MAX_ROWS,
            (park.attractions ?? []).filter((a) => a.isHeadliner && isInSeason(a)).length
          )
        : 0,
    [park.attractions, waitsReadable]
  );

  // "Next" is a question about the clock, so it cannot be answered during a server render — and
  // must not be answered during a client render either (react-hooks/purity). `useBrowserNow`
  // hands it over after mount and re-ticks each minute, which is also what keeps the countdown
  // honest on a tab somebody left open. Until it lands, `now` is null and the column renders its
  // reserved rows muted rather than guessing.
  const now = useBrowserNow(60_000);

  // The next few showtimes across the whole park, not per show: three cards each showing their
  // own next slot would answer "when is Wings of Change" — the question here is what starts next.
  const nextShows = useMemo(() => {
    if (!now) return [];
    const nowMs = now.getTime();
    return (park.shows ?? [])
      .filter((s) => isInSeason(s))
      .flatMap((s) =>
        (s.showtimes ?? []).map((st) => ({ name: stripNewPrefix(s.name), startTime: st.startTime }))
      )
      .filter((e) => new Date(e.startTime).getTime() > nowMs)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, MAX_ROWS);
  }, [park.shows, now]);

  // Shortest first: the top row is the recommendation, not the trophy. A headliner with no
  // standby reading (closed, or a park whose feed never carries one) sorts last and renders a
  // dash rather than dropping out of the list and shortening the band.
  const headliners = useMemo(() => {
    if (!waitsReadable) return [];
    return (park.attractions ?? [])
      .filter((a) => a.isHeadliner && isInSeason(a))
      .map((a) => ({
        name: stripNewPrefix(a.name),
        slug: a.slug,
        wait: getAttractionDisplayStatus(a, park.status) === 'OPERATING' ? getStandbyWait(a) : null,
      }))
      .sort((a, b) => {
        if (a.wait === null) return 1;
        if (b.wait === null) return -1;
        return a.wait - b.wait;
      })
      .slice(0, MAX_ROWS);
  }, [park.attractions, park.status, waitsReadable]);

  if (showSlots === 0 && headlinerSlots === 0) return null;

  return (
    <div className={className}>
      <div className="border-border/50 mt-5 grid max-w-3xl gap-x-5 gap-y-4 border-t pt-4 sm:grid-cols-2">
        {headlinerSlots > 0 && (
          <div className="flex flex-col gap-1.5">
            <Caption icon={Crown}>{t('headlinersNow')}</Caption>
            <ul className="flex flex-col gap-1">
              {Array.from({ length: headlinerSlots }, (_, i) => {
                const ride = headliners[i];
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {ride ? (
                      <>
                        <Link
                          href={
                            `${parkPath}/${ride.slug}` as '/parks/europe/germany/rust/europa-park'
                          }
                          prefetch={false}
                          className="hover:text-primary min-w-0 flex-1 truncate transition-colors"
                        >
                          {ride.name}
                        </Link>
                        {ride.wait !== null ? (
                          <span className="font-semibold tabular-nums">
                            <WaitTimeValue minutes={ride.wait} /> {t('overview.minutesUnit')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {showSlots > 0 && (
          <div className="flex flex-col gap-1.5">
            <Caption icon={Sparkles}>{t('nextShows')}</Caption>
            <ul className="flex flex-col gap-1">
              {Array.from({ length: showSlots }, (_, i) => {
                const show = nextShows[i];
                if (!show) {
                  return (
                    <li key={i} className="text-muted-foreground text-sm">
                      {/* Before the clock arrives every row is a dash: the rows are the right
                          height and the caption is already readable, so nothing moves when the
                          real times land a beat later. Saying "keine Vorstellung mehr heute"
                          here would be a claim made without knowing the time. */}
                      {now && i === 0 ? tCommon('noShowtimesToday') : '—'}
                    </li>
                  );
                }
                // `nextShows` is empty until `now` lands, so a row here always has one — the
                // ternary is for the type checker, which cannot see that.
                const startsIn = now ? new Date(show.startTime).getTime() - now.getTime() : 0;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-semibold tabular-nums">
                      <LocalTime time={show.startTime} timeZone={park.timezone || 'UTC'} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{show.name}</span>
                    {/* Only the imminent one carries a countdown. On all three it reads as a
                        column of durations and stops meaning "this is the one to walk to". */}
                    {i === 0 && startsIn > 0 && (
                      <span className="text-primary shrink-0 text-xs font-medium">
                        {t('startsIn')} {formatDurationShort(startsIn, tCommon)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
