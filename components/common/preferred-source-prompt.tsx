import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import { PreferredSourceButton } from './preferred-source-button';

interface PreferredSourcePromptProps {
  className?: string;
  /** Slimmer padding + heading for a secondary spot (e.g. below the photo CTA on park/ride pages). */
  compact?: boolean;
}

/**
 * "Make park.fan a preferred source on Google" band around `PreferredSourceButton`, for spots where
 * the footer link goes unseen (the end of blog articles, the homepage). Strings live in
 * `footer.preferredSource` with the button's. The sheen is its own layer, because a gradient class
 * beside `bg-card/85` would make tailwind-merge drop one of them.
 */
export async function PreferredSourcePrompt({
  className,
  compact = false,
}: PreferredSourcePromptProps) {
  const t = await getTranslations('footer.preferredSource');

  return (
    <section
      data-card=""
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-md',
        compact ? 'p-4 sm:p-5' : 'p-6 sm:p-7',
        'border-primary/25 bg-card/85',
        className
      )}
    >
      <div
        className="from-primary/10 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className={cn('text-foreground font-bold', compact ? 'text-base' : 'text-lg')}>
            {t('promptTitle')}
          </h2>
          <p className="text-muted-foreground text-sm">{t('promptText')}</p>
        </div>
        <PreferredSourceButton className="shrink-0" />
      </div>
    </section>
  );
}
