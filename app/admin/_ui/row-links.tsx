'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { pathEditorHref } from '@/lib/admin/site-analytics';

const ROW_LINK_CLASS =
  'text-muted-foreground hover:text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded';

/** The small icon link beside a row; `external` opens a new tab, `label` is tooltip and name. */
function RowLink({
  href,
  label,
  external,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className={ROW_LINK_CLASS}
    >
      {children}
    </a>
  ) : (
    <Link href={href} title={label} aria-label={label} className={ROW_LINK_CLASS}>
      {children}
    </Link>
  );
}

/** The icon link to a page on park.fan, opening in a new tab; `label` is the accessible name. */
export function PublicLink({
  href,
  label = 'Auf park.fan öffnen',
}: {
  href: string;
  label?: string;
}) {
  return (
    <RowLink href={href} label={label} external>
      <ExternalLink className="h-3.5 w-3.5" />
    </RowLink>
  );
}

/** The two links every page row carries: the public page, and for a park or ride its editor. */
export function PageLinks({ path }: { path: string }) {
  const editor = pathEditorHref(path);
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <PublicLink href={path} />
      {editor && (
        <RowLink href={editor} label="Im Editor öffnen">
          <Pencil className="h-3.5 w-3.5" />
        </RowLink>
      )}
    </span>
  );
}
