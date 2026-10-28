'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { pathEditorHref } from '@/lib/admin/site-analytics';

/** Rows shown before the rest of a list waits behind a button. */
export const LIST_SHOWN = 12;

/** The icon link to a page on park.fan, opening in a new tab; `label` is the accessible name. */
export function PublicLink({
  href,
  label = 'Auf park.fan öffnen',
}: {
  href: string;
  label?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title="Auf park.fan öffnen"
      aria-label={label}
      className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

/** The two links every page row carries: the public page, and for a park or ride its editor. */
export function PageLinks({ path }: { path: string }) {
  const editor = pathEditorHref(path);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <PublicLink href={path} />
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

/**
 * The first {@link LIST_SHOWN} rows of a list, or all of them once opened, with the props for its
 * {@link MoreButton} and a way to fold it again when the list changes underneath.
 */
export function useShowMore<T>(rows: readonly T[]) {
  const [open, setOpen] = useState(false);
  return {
    shown: open ? rows : rows.slice(0, LIST_SHOWN),
    more: { total: rows.length, open, onToggle: () => setOpen((value) => !value) },
    collapse: () => setOpen(false),
  };
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
