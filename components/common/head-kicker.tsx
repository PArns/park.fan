import type { ReactNode } from 'react';

/**
 * The small line over a page's `<h1>`: a primary dot and uppercase, widely spaced text. The
 * landing pages' head, the blog article's banner and a glossary term's head open with it. As a
 * `span` it is the first line inside an `<h1>`, where the head asks a question and the kicker line
 * carries the page's search term (`LandingHero`'s `question`).
 */
export function HeadKicker({ children, as = 'p' }: { children: ReactNode; as?: 'p' | 'span' }) {
  const Tag = as;
  return (
    <Tag className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
      <span aria-hidden className="bg-primary inline-block h-2 w-2 shrink-0 rounded-full" />
      {children}
    </Tag>
  );
}
