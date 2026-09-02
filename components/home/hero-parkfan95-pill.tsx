import { Globe } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Silas Fischer's own site — the one people are looking for when they land here by mistake. */
const PARKFAN95_SITE = 'https://parkfan95.de';
/** His channel, found via the site's own header links rather than guessed from the brand name. */
const PARKFAN95_YOUTUBE = 'https://www.youtube.com/@Parkfan95';

/**
 * YouTube's own mark, drawn here because `lucide-react` carries no brand icons — and a
 * monochrome `Play` did not read as "YouTube" at 20 px on a photo. The red is the brand's
 * (#FF0000) rather than a token: it is the thing that makes the link recognisable before
 * anybody reads the label.
 */
function YouTubeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path
        fill="#FF0000"
        d="M23.5 6.2a3 3 0 0 0-2.11-2.12C19.5 3.57 12 3.57 12 3.57s-7.5 0-9.39.51A3 3 0 0 0 .5 6.2C0 8.09 0 12 0 12s0 3.91.5 5.8a3 3 0 0 0 2.11 2.12c1.89.51 9.39.51 9.39.51s7.5 0 9.39-.51a3 3 0 0 0 2.11-2.12C24 15.91 24 12 24 12s0-3.91-.5-5.8Z"
      />
      <path fill="#fff" d="M9.6 15.6 15.82 12 9.6 8.4v7.2Z" />
    </svg>
  );
}

/**
 * German-only signpost at the foot of the hero: park.fan now outranks Parkfan95 for his own
 * name, so a share of the visitors arriving here wanted him and not a wait-time database.
 * The pill hands them the two places they were actually heading for.
 *
 * **German only, and hard-coded rather than routed through `messages/`.** The mix-up exists in
 * exactly one search market — a Dutch or Spanish visitor never typed his name — so the other
 * five locales would carry a key they never render, and `check:untranslated` would then have
 * to be told that five German strings are fine. `locale === 'de'` at the call site with the
 * copy in place is the same shape `app/[locale]/impressum` already uses for German-only text.
 *
 * **It sits ON the photo, not on the hero's glass plate**, which is where it started and where
 * it disappeared: `text-muted-foreground` behind a `/50` border is the plate's quietest
 * material, and against a busy hero image the whole pill read as part of the plate's bottom
 * edge. Out here it borrows the material the image attribution in the opposite corner already
 * uses — a light veil, a small blur and full-strength text — so the two things drawn straight
 * onto the picture are made of the same thing.
 */
export function HeroParkfan95Pill({ className }: { className?: string }) {
  const linkClass =
    'inline-flex items-center gap-1.5 font-semibold text-black hover:text-black/70 dark:text-white dark:hover:text-white/75 underline-offset-4 transition-colors hover:underline';

  return (
    <div
      className={cn(
        // min-h rather than a fixed height: the sentence plus two links wraps to a second line
        // on a phone, and a fixed height would clip the links off it.
        'flex min-h-10 w-fit max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5',
        'rounded-full border border-white/25 px-4 py-2 text-sm shadow-lg',
        // The image attribution's material (bottom-right on lg+), so both things sitting
        // directly on the photo are made of the same glass. The blur is affordable here for the
        // same reason it is there and not on the plate's own children: one small box, not a
        // 64 px filter over the whole ken-burns frame.
        'bg-white/20 backdrop-blur-sm dark:bg-black/35',
        className
      )}
    >
      <span className="text-black/75 dark:text-white/80">
        Suchst du nach{' '}
        <strong className="font-semibold text-black dark:text-white">Parkfan95</strong> und{' '}
        <strong className="font-semibold text-black dark:text-white">Silas</strong>?
      </span>
      <a href={PARKFAN95_SITE} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <Globe className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
        parkfan95.de
      </a>
      <a
        href={PARKFAN95_YOUTUBE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Parkfan95 auf YouTube"
        className={linkClass}
      >
        <YouTubeMark className="h-5 w-5 shrink-0" />
        YouTube
      </a>
    </div>
  );
}
