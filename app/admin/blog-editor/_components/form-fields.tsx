'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Labeled form field shared by the create-author and create-category modals
 * (and anything else that wants a Notion-style "tiny uppercase label above
 * input with optional hint below"). Lives outside any single modal so the
 * exact label/hint typography stays in lock-step.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </span>
      {children}
      {hint && (
        <span
          className={cn(
            'text-[10px]',
            error ? 'text-destructive' : 'text-muted-foreground/70'
          )}
        >
          {hint}
        </span>
      )}
    </label>
  );
}
