'use client';

import Link from 'next/link';
import { TICKET_CLICKS_HREF } from '@/lib/admin/tickets';

/**
 * „Klicks (30 T.): 12“ for a product or one of its links, leading to the event's own page. An
 * unknown figure is never shown as 0: it is still loading, the read failed, or the product sits in
 * the rest of a table cut at 30 values, and each says so.
 */
export function ClickFigure({
  count,
  loading,
  failed,
}: {
  count: number | null;
  loading: boolean;
  failed: boolean;
}) {
  const [value, title] =
    count !== null
      ? [count.toLocaleString('de-DE'), 'Klicks auf den Ticketlink in den letzten 30 Tagen']
      : loading
        ? ['…', 'Lädt']
        : failed
          ? ['–', 'Die Klicks ließen sich nicht abrufen.']
          : [
              '–',
              'Nicht unter den 30 meistgeklickten Werten; die Ereignisseite zählt sie unter „Übrige“.',
            ];
  return (
    <Link
      href={TICKET_CLICKS_HREF}
      title={title}
      className="hover:text-foreground underline-offset-2 hover:underline"
    >
      Klicks (30 T.): <span className="tabular-nums">{value}</span>
    </Link>
  );
}
