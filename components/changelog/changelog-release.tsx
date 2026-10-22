import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Sparkles, TrendingUp, Wrench, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PANEL_FLAT } from '@/components/common/glass-card';
import { changelogAnchor } from '@/lib/changelog/paths';
import type { ChangelogEntry } from '@/lib/changelog/types';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';

/** `2026-09-21` printed as `21 September 2026`, in English, without a client locale. */
function formatReleaseDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return getDateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/** The three sections a release is written in (`content/changelog/README.md`), one colour each. */
const SECTION_STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  New: { icon: Sparkles, className: 'bg-primary/15 text-primary' },
  Improved: { icon: TrendingUp, className: 'bg-status-operating/15 text-status-operating' },
  Fixed: { icon: Wrench, className: 'bg-status-down/15 text-status-down' },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  const style = typeof children === 'string' ? SECTION_STYLE[children] : undefined;
  const Icon = style?.icon;
  return (
    <h3 className="mt-8 mb-1 border-t pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase',
          style?.className ?? 'bg-muted text-muted-foreground'
        )}
      >
        {Icon && <Icon className="size-3.5" aria-hidden="true" />}
        {children}
      </span>
    </h3>
  );
}

/**
 * One release on the public changelog, a stop on the page's timeline: an `<article>` with the
 * version, date and the release notes rendered from markdown. From `xl` the version and date stand
 * in a sticky column left of the card; below it they head the card. Server Component.
 */
export function ChangelogRelease({ entry, latest }: { entry: ChangelogEntry; latest: boolean }) {
  // A run of versions is one entry (see `through` in `lib/changelog/types.ts`), and its label
  // names both ends with the unspaced en dash a range takes.
  const label = entry.through ? `${entry.version}–${entry.through}` : entry.version;

  return (
    <article
      id={changelogAnchor(entry.version)}
      className="relative scroll-mt-20 xl:grid xl:grid-cols-[9rem_minmax(0,1fr)] xl:gap-10"
    >
      {/* The dot on the line the page draws down the left edge, from `xl`. */}
      <span
        aria-hidden
        className={cn(
          'ring-background absolute top-8 -left-[calc(2.5rem+5px)] hidden size-3 rounded-full ring-4 xl:block',
          latest ? 'bg-primary' : 'bg-muted-foreground/60'
        )}
      />
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 xl:sticky xl:top-20 xl:mb-0 xl:flex-col xl:items-start xl:self-start xl:pt-6">
        <span className="font-mono text-lg font-bold tabular-nums xl:text-2xl">{label}</span>
        <time dateTime={entry.date} className="text-muted-foreground text-sm">
          {formatReleaseDate(entry.date)}
        </time>
        {(latest || entry.reconstructed) && (
          <span className="flex flex-wrap gap-2">
            {latest && <Badge variant="default">Latest</Badge>}
            {entry.reconstructed && (
              <Badge
                variant="outline"
                className="text-muted-foreground"
                title="Written in September 2026 from the commit history"
              >
                Reconstructed
              </Badge>
            )}
          </span>
        )}
      </div>

      <div className={cn('min-w-0 rounded-2xl border p-5 shadow-sm sm:p-8', PANEL_FLAT)}>
        <header className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {entry.title}
          </h2>
          {entry.summary && (
            <p className="text-foreground/80 mt-3 max-w-3xl text-base leading-relaxed sm:text-lg">
              {entry.summary}
            </p>
          )}
        </header>

        {entry.highlights.map((highlight) => (
          <figure key={highlight.src} className="mb-8">
            <div className="overflow-hidden rounded-xl border">
              <Image
                src={highlight.src}
                alt={highlight.alt}
                width={highlight.width ?? 1600}
                height={highlight.height ?? 900}
                sizes="(max-width: 1024px) 100vw, 900px"
                className="h-auto w-full"
              />
            </div>
            {(highlight.caption || highlight.credit) && (
              <figcaption className="text-muted-foreground mt-2 text-sm">
                {highlight.caption}
                {highlight.caption && highlight.credit ? ' ' : null}
                {highlight.credit && <span className="opacity-70">{highlight.credit}</span>}
              </figcaption>
            )}
          </figure>
        ))}

        {/*
          Every element is mapped by hand: `@tailwindcss/typography` is not installed, so `prose` is
          inert. The classes are the blog's (`components/blog/blog-content.tsx`). `## New` is drawn
          as a coloured section label, ranking under the release title.
        */}
        <ReactMarkdown
          components={{
            h2: ({ children }) => <SectionLabel>{children}</SectionLabel>,
            p: ({ children }) => (
              <p className="text-foreground/90 my-5 max-w-3xl leading-[1.75]">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-foreground/90 marker:text-muted-foreground my-4 max-w-3xl list-disc space-y-3 pl-6 leading-[1.75]">
                {children}
              </ul>
            ),
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            code: ({ children }) => (
              <code className="bg-muted rounded px-1 py-0.5 text-[0.9em]">{children}</code>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary underline underline-offset-2"
                {...(href?.startsWith('http')
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
              >
                {children}
              </a>
            ),
          }}
        >
          {entry.content}
        </ReactMarkdown>
      </div>
    </article>
  );
}
