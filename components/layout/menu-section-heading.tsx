import { Link } from '@/i18n/navigation';

/**
 * The rule above a column in one of the header's menu bands, in one definition so the bands read as
 * one surface. `href` and `count` are optional: not every column has a hub or a number. `aside`
 * sits on the same rule at the right, outside the link and its type (the blog panel's search
 * field). `as` makes the label a real heading where the rule opens a section of a page (the
 * most-read lists). No `'use client'`, since there is no hook here and Server Components (the
 * footer) render it too.
 */
export function MenuSectionHeading({
  label,
  count,
  href,
  aside,
  as: Tag = 'div',
}: {
  label: string;
  count?: number;
  href?: string;
  aside?: React.ReactNode;
  as?: 'div' | 'h2' | 'h3';
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
  const rule = 'border-border/60 mb-2 flex justify-between gap-2 border-b pb-1.5';
  const type = 'text-xs font-semibold tracking-wide uppercase text-foreground';
  const ink = href ? 'hover:text-primary transition-colors' : '';
  const className = aside
    ? `flex min-w-0 items-baseline gap-2 ${type} ${ink}`
    : `${rule} items-baseline ${type} ${ink}`;

  const heading = href ? (
    <Link href={href as '/'} prefetch={false} className={className}>
      {inner}
    </Link>
  ) : (
    <Tag className={className}>{inner}</Tag>
  );

  if (!aside) return heading;
  return (
    <div className={`${rule} items-center`}>
      {heading}
      {aside}
    </div>
  );
}
