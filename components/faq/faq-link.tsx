'use client';

import type { ReactNode } from 'react';

/**
 * A link to one question of a FAQ on the same page (`FaqRow.id`). It opens the question on the way,
 * since a fragment that lands on a closed `<details>` shows only its summary. Without script it is
 * a plain fragment link and still scrolls there.
 */
export function FaqLink({
  id,
  children,
  className,
  onOpen,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  /** Called on the press, before the question opens: where the link counts itself. */
  onOpen?: () => void;
}) {
  return (
    <a
      href={`#${id}`}
      className={className}
      onClick={() => {
        onOpen?.();
        const row = document.getElementById(id);
        if (row instanceof HTMLDetailsElement) row.open = true;
      }}
    >
      {children}
    </a>
  );
}
