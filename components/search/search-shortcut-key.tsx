import { SEARCH_SHORTCUT_KEY } from '@/lib/utils/page-focus';
import { cn } from '@/lib/utils';

/**
 * The search shortcut drawn as a key (`/`), at the right edge of every search field and trigger
 * that `/` reaches. Decorative: the field carries `aria-keyshortcuts` for a screen reader.
 */
export function SearchShortcutKey({ className }: { className?: string }) {
  return (
    <kbd
      aria-hidden="true"
      className={cn(
        'bg-primary/20 text-primary border-primary/20 pointer-events-none h-5 items-center justify-center rounded border px-1.5 font-mono text-[11px] font-medium shadow-sm select-none',
        className
      )}
    >
      {SEARCH_SHORTCUT_KEY}
    </kbd>
  );
}
