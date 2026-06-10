import { type LucideIcon, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/common/glass-card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface BlogSectionHeaderAction {
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface BlogSectionHeaderProps {
  /** Small pill above the title (defaults to a Newspaper + brand badge text). */
  badge?: string;
  badgeIcon?: LucideIcon;
  /** Main heading text. */
  title: React.ReactNode;
  /** One-line subtitle / intro paragraph. */
  intro?: React.ReactNode;
  /** Smaller info line under the intro (e.g. page count). */
  meta?: React.ReactNode;
  /** Optional CTA rendered on the right. */
  action?: BlogSectionHeaderAction;
  /** Heading element to render. Use 'h1' on dedicated pages, 'h2' inside sections. */
  as?: 'h1' | 'h2';
  /** Whether to wrap the content in a glass panel. */
  glass?: boolean;
  className?: string;
}

/**
 * Shared header used by the blog index page, category pages, and the latest
 * blog section on the homepage. Wrapping it in a GlassCard keeps the visual
 * language consistent with the rest of park.fan (hero, AnnounceSection,
 * favorites section).
 */
export function BlogSectionHeader({
  badge,
  badgeIcon: BadgeIcon = Newspaper,
  title,
  intro,
  meta,
  action,
  as: Heading = 'h2',
  glass = true,
  className,
}: BlogSectionHeaderProps) {
  const isPageHero = Heading === 'h1';
  const headingClass = isPageHero
    ? 'text-foreground text-4xl font-bold tracking-tight sm:text-5xl'
    : 'text-foreground text-2xl font-bold sm:text-3xl';

  const inner = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {badge && (
          <div className="bg-primary/10 text-primary mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <BadgeIcon className="h-3.5 w-3.5" />
            {badge}
          </div>
        )}
        <Heading className={headingClass}>{title}</Heading>
        {intro && (
          <p className="text-muted-foreground mt-3 text-base sm:text-lg">{intro}</p>
        )}
        {meta && <p className="text-muted-foreground mt-2 text-xs">{meta}</p>}
      </div>
      {action && (
        <Button asChild variant="outline" className="rounded-full">
          <Link href={action.href as '/'} prefetch={false}>
            {action.label}
            {action.icon && <action.icon className="h-3.5 w-3.5" />}
          </Link>
        </Button>
      )}
    </div>
  );

  if (!glass) {
    return <header className={cn('mb-10', className)}>{inner}</header>;
  }

  return (
    <GlassCard
      variant="light"
      className={cn('mb-10 border-white/30 bg-white/35 px-6 py-7 dark:border-white/10 dark:bg-black/35', className)}
    >
      <header>{inner}</header>
    </GlassCard>
  );
}
