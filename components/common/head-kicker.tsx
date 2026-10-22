import type { ReactNode } from 'react';

/**
 * The small line over a page's `<h1>`: a primary dot and uppercase, widely spaced text. The
 * landing pages' head, the blog article's banner and a glossary term's head open with it.
 */
export function HeadKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
      <span className="bg-primary inline-block h-2 w-2 shrink-0 rounded-full" />
      {children}
    </p>
  );
}
