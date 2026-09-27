import { Link } from '@/i18n/navigation';

/**
 * The rule above a column in one of the header's menu bands.
 *
 * One definition, for the same reason `MenuBand` is one: the bands are meant to read as one
 * surface whichever trigger opened them, and a heading that is a shade lighter or a pixel lower in
 * the second panel is the kind of drift nobody reports and everybody sees. It started as a private
 * helper inside `ParksMenuPanel`; the "more" panel needs the identical rule, so it moved here
 * rather than being typed a second time.
 *
 * `href` is optional because not every column has a hub to point at, and `count` because most do
 * not have a number worth printing.
 *
 * No `'use client'`: there is no hook, no state and no handler in here. With the directive it
 * would be a client reference of its own wherever a Server Component renders it. Everything that
 * imports it today is a client component itself — `ParksMenuPanel`, `BlogMenuPanel` (the "more"
 * panel drew cards instead from PAR-269) and the footer's `FooterLinkGroup`, which folds each
 * column on a phone (PAR-437) — so it compiles into their bundles without it.
 */
export function MenuSectionHeading({
  label,
  count,
  href,
}: {
  label: string;
  count?: number;
  href?: string;
}) {
  const inner = (
    <>
      <span className="truncate">{label}</span>
      {count != null && (
        <span className="text-muted-foreground/70 text-[11px] font-normal tabular-nums">
          {count}
        </span>
      )}
    </>
  );
  const className =
    'border-border/60 mb-2 flex items-baseline justify-between gap-2 border-b pb-1.5 text-xs font-semibold tracking-wide uppercase';

  if (!href) return <div className={`${className} text-foreground`}>{inner}</div>;
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className={`${className} text-foreground hover:text-primary transition-colors`}
    >
      {inner}
    </Link>
  );
}
