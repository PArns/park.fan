import { Globe, Play } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Silas Fischer's own site — the one people are looking for when they land here by mistake. */
const PARKFAN95_SITE = 'https://parkfan95.de';
/** His channel, found via the site's own header links rather than guessed from the brand name. */
const PARKFAN95_YOUTUBE = 'https://www.youtube.com/@Parkfan95';

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
 * It carries `data-hero-under-search` like the pill row above it: both sit in the area the
 * search dropdown expands over, so both fade while the field has focus (see `HeroTextPanel`).
 */
export function HeroParkfan95Pill({ className }: { className?: string }) {
  const linkClass =
    'text-foreground/90 hover:text-primary inline-flex items-center gap-1.5 font-medium underline-offset-4 transition-colors hover:underline';

  return (
    <div
      data-hero-under-search=""
      className={cn(
        // min-h instead of the pill row's fixed h-9: the sentence plus two links wraps to a
        // second line on a phone, and a fixed height would clip the links off it.
        'border-border/50 bg-background/60 flex min-h-9 w-fit max-w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border px-3.5 py-1.5 text-sm shadow-sm',
        'transition-opacity duration-200',
        className
      )}
    >
      <span className="text-muted-foreground">Suchst du eher nach Silas und Parkfan95?</span>
      <a href={PARKFAN95_SITE} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        parkfan95.de
      </a>
      <span className="text-border" aria-hidden="true">
        ·
      </span>
      <a
        href={PARKFAN95_YOUTUBE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Parkfan95 auf YouTube"
        className={linkClass}
      >
        {/* `Play`, not a YouTube glyph: lucide carries no brand icons, and the video embed in
          the blog already labels YouTube with this one. */}
        <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden="true" />
        YouTube
      </a>
    </div>
  );
}
