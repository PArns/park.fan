import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import type { ChangelogEntry } from '@/lib/changelog/types';

/**
 * One release on the public changelog.
 *
 * A Server Component with no state and no client bytes: the page is a list of
 * headings, paragraphs and images, and the only thing a visitor does on it is
 * read. A release is an `<article>` under a heading that carries the version,
 * so the page's outline reads as a list of versions rather than a wall of
 * bullet points.
 */

/** `2026-09-21` printed as `21 September 2026`, in English, without a client locale. */
function formatReleaseDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function ChangelogRelease({ entry }: { entry: ChangelogEntry }) {
  return (
    <article
      id={`v${entry.version}`}
      className="scroll-mt-20 border-t pt-10 first:border-t-0 first:pt-0"
    >
      <header className="mb-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Badge variant="default" className="px-3 py-1 text-sm tabular-nums">
            {entry.version}
          </Badge>
          <time dateTime={entry.date} className="text-muted-foreground text-sm">
            {formatReleaseDate(entry.date)}
          </time>
        </div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{entry.title}</h2>
        {entry.summary && (
          <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
            {entry.summary}
          </p>
        )}
      </header>

      {entry.highlights.map((highlight) => (
        <figure key={highlight.src} className="mb-8">
          <div className="overflow-hidden rounded-2xl border">
            <Image
              src={highlight.src}
              alt={highlight.alt}
              width={highlight.width ?? 1600}
              height={highlight.height ?? 900}
              sizes="(max-width: 768px) 100vw, 768px"
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
        Every element is mapped by hand rather than left to a `prose` class:
        `@tailwindcss/typography` is not installed here, so `prose` is inert and
        a markdown list would render without its markers. The classes are the
        blog's (`components/blog/blog-content.tsx`), so a paragraph reads the
        same on both surfaces.

        `## New` is drawn as a section label rather than a heading of its own
        size: inside a release it ranks under the release title above it.
      */}
      <ReactMarkdown
        components={{
          h2: ({ children }) => (
            <h3 className="text-muted-foreground mt-8 mb-3 border-t pt-6 text-xs font-semibold tracking-wide uppercase first:mt-0 first:border-t-0 first:pt-0">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="text-foreground/90 my-5 leading-[1.75]">{children}</p>,
          ul: ({ children }) => (
            <ul className="text-foreground/90 my-5 list-disc space-y-3 pl-6 leading-[1.75]">
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
    </article>
  );
}
