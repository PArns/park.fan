'use client';

import type { ReactNode } from 'react';
import { Field as AdminField } from '../../_ui/controls';

/** The blog editor's labelled field: the admin's shared one, with `error` as a boolean. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  /** Boolean here, a message in the shared component: when set, the hint is the error text. */
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <AdminField label={label} hint={error ? undefined : hint} error={error ? (hint ?? ' ') : null}>
      {children}
    </AdminField>
  );
}
