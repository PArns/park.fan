import type { ReactNode } from 'react';

/** A chapter heading on the legal pages, with the rule beneath it. */
export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
      {children}
    </h2>
  );
}

/** A section heading inside a chapter of a legal page. */
export function LegalH3({ children }: { children: ReactNode }) {
  return <h3 className="mt-8 mb-4 text-2xl font-semibold">{children}</h3>;
}

/** A bulleted list on a legal page. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1 pl-6">{children}</ul>;
}

/** A link to another site from a legal page; opens in a new tab and shows the target as written. */
export function LegalLink({ href, children }: { href: string; children?: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 break-words underline"
    >
      {children ?? href}
    </a>
  );
}
