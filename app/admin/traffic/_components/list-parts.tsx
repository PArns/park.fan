'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { pathEditorHref } from '@/lib/admin/site-analytics';

/** Rows shown before the rest of a list waits behind a button. */
export const LIST_SHOWN = 12;

/** The two links every page row carries: the public page, and for a park or ride its editor. */
export function PageLinks({ path }: { path: string }) {
  const editor = pathEditorHref(path);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <a
        href={path}
        target="_blank"
        rel="noreferrer noopener"
        title="Auf park.fan öffnen"
        aria-label="Auf park.fan öffnen"
        className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      {editor && (
        <Link
          href={editor}
          title="Im Editor öffnen"
          aria-label="Im Editor öffnen"
          className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Link>
      )}
    </span>
  );
}

/** A show-more switch for a list that is longer than {@link LIST_SHOWN}. */
export function MoreButton({
  total,
  open,
  onToggle,
}: {
  total: number;
  open: boolean;
  onToggle: () => void;
}) {
  if (total <= LIST_SHOWN) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-primary border-border/50 w-full border-t px-4 py-2.5 text-left text-xs hover:underline max-sm:min-h-11"
    >
      {open ? 'weniger zeigen' : `${total - LIST_SHOWN} weitere zeigen`}
    </button>
  );
}
