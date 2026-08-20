'use client';

import type { ReactNode } from 'react';
import { Field as AdminField } from '../../_ui/controls';

/**
 * The blog editor's labelled field, now the admin's labelled field.
 *
 * This used to be its own implementation, and it was one of three: the media
 * panel kit and `_lib/ui.tsx` each had a `Field` too, with different label
 * sizes and different ideas about where a hint goes. Three definitions of the
 * same thing is exactly the drift the reuse rule exists to prevent, so this is
 * now an adapter over the shared one — kept as a module rather than deleted
 * because a dozen call sites pass `error` as a boolean, and changing those in
 * the same pass would have mixed two unrelated diffs.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Boolean here, a message in the shared component — the hint doubles as the
   *  error text when it is set, which is how the call sites already use it. */
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <AdminField label={label} hint={error ? undefined : hint} error={error ? (hint ?? ' ') : null}>
      {children}
    </AdminField>
  );
}
