import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

/**
 * The link from a menu panel to the overview it previews ("Alle Beiträge", "Alle News") with the
 * number of posts there: the panel shows five or six, and this says where the rest are. Tinted
 * rather than a bare text link, because a link that reads as a label was missed. One definition,
 * so the blog and the news panel end the same way. No hook, like `MenuSectionHeading`.
 */
export function MenuAllLink({
  href,
  label,
  count,
  className,
}: {
  href: string;
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className={cn(
        'bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-ring inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      {label}
      <span className="text-primary/70 font-normal tabular-nums">{count}</span>
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </Link>
  );
}
