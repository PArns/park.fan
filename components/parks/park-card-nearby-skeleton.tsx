import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Placeholder for one `<ParkCard>`, at the height the real card measures.
 *
 * The numbers are the card's own rows, read off a rendered one rather than guessed:
 * top panel 100 px, photo row 0 below `sm` and 220 px from there up, bottom panel 45 px — so
 * 145 px on a phone and 365 px on a desktop, against a live card's 145.6 / 365.6.
 *
 * The photo row is what makes the breakpoint matter: `ParkCard` reserves `sm:min-h-[220px]`
 * for its picture, so below `sm` it has no photo row at all and is less than half as tall. A
 * placeholder with one height for every breakpoint was 360 px everywhere, which on a phone
 * over-reserved by a factor of 2.4 — the featured-parks grid collapsed by 1284 px when the
 * real cards landed.
 *
 * ON DESKTOP THE ROW IS A BET, so `withPhoto` says whether to take it. `ParkCard` sets that
 * `min-h` only `backgroundImage && …`, and **9 of 212 parks have a photo in the media
 * database** (attractiepark-toverland, bobbejaanland, disneyland-park, efteling, europa-park,
 * movie-park-germany, phantasialand, walibi-belgium, walibi-holland — all DE/NL/BE/FR). One
 * photo anywhere in the grid makes every `1fr` track resolve to the same tall size, so it
 * comes down to whether the visitor's list contains one of those nine.
 *
 * Default `true`, because for the nearby list the answer is genuinely unknown at render time
 * and both sides cost. Measured against the settled list, per client IP:
 *
 *   with the row     Berlin +25 px · US −405 · Tokyo −442 · London −443 · Hong Kong −414
 *   without it       Berlin −465…−502 px · everywhere else +59…+97
 *
 * Dropping it halves the total error and turns every miss into growth rather than a collapse,
 * but it costs half a viewport on exactly the audience this site is written for: the homepage
 * went 0.062 → 0.558 for it. The other side is not free either — a US desktop visitor pays up
 * to 0.28 for the row, and how much depends on where they are reading (0.0054 vs 0.1776 at
 * scroll 1600, 0.0187 vs 0.2813 at 2000). Picking a side is a decision about who the visitor
 * is, not a tidy-up; re-measure with `pnpm measure:cls --ip=<addr>` before touching it.
 *
 * Pass `withPhoto={false}` only where the data settles it. The "busiest / quietest park" rows
 * in the global statistics are the two ends of a wait-time ranking, and none of the nine
 * photo parks reach either end — Phantasialand is 10th — so there the row is 221 px of
 * reserved space for a picture that never comes.
 */
export function ParkCardNearbySkeleton({ withPhoto = true }: { withPhoto?: boolean }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-[20px] border border-white/10">
      {/* Full-bleed photo skeleton */}
      <div className="absolute inset-0 z-0">
        <Skeleton className="h-full w-full rounded-none" />
      </div>

      {/* Fav button skeleton */}
      <div className="absolute top-3 right-3 z-[4]">
        <Skeleton className="h-[34px] w-[34px] rounded-full" />
      </div>

      {/* Top panel — name, city line, status chips: 28 px padding + 20 + 3 + 18 + 9 + 22 */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <Skeleton className="h-5 w-36 max-w-[80%] opacity-60" />
        <Skeleton className="mt-[3px] h-[18px] w-24 opacity-40" />
        <div className="mt-[9px] flex gap-1.5">
          <Skeleton className="h-[22px] w-20 rounded-full opacity-60" />
          <Skeleton className="h-[22px] w-16 rounded-full opacity-40" />
        </div>
      </div>

      {/* Photo row — nothing below `sm`, where the card shows no picture either */}
      <div className={cn('relative z-[2] flex-1', withPhoto && 'sm:min-h-[220px]')} />

      {/* Bottom panel — one line: 28 px padding + 17 */}
      <div className="relative z-[3] shrink-0 bg-black/30 px-4 py-3.5">
        <Skeleton className="h-[17px] w-40 max-w-[70%] opacity-50" />
      </div>
    </article>
  );
}
