import { Link } from '@/i18n/navigation';

/**
 * The rule above a column in one of the header's menu bands, in one definition so the bands read as
 * one surface. `href` and `count` are optional: not every column has a hub or a number. No
 * `'use client'`, since there is no hook here and Server Components (the footer) render it too.
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
