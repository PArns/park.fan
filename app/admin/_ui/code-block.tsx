import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A system monospace stack. `font-mono` is aliased to the sans font site-wide, which is right for
 * inline snippets but not where a person compares characters: `l`, `I` and `1` in a token, or the
 * letters of a host name they are about to trust.
 */
export const SYSTEM_MONO = '[font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]';

/**
 * A boxed command, address or token in the monospace stack, selected whole on a click. `breakAnywhere`
 * is for a single long string (a token); a command wraps at its spaces.
 */
export function CodeBlock({
  children,
  breakAnywhere = false,
}: {
  children: ReactNode;
  breakAnywhere?: boolean;
}) {
  return (
    <code
      className={cn(
        'border-border/60 bg-muted/40 block rounded-lg border px-3 py-2 text-xs leading-relaxed select-all',
        SYSTEM_MONO,
        breakAnywhere ? 'break-all' : 'break-words'
      )}
    >
      {children}
    </code>
  );
}
