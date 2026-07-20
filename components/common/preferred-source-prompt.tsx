import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';
import { PreferredSourceButton } from './preferred-source-button';

interface PreferredSourcePromptProps {
  className?: string;
}

/**
 * Contextual "make park.fan a preferred source on Google" band: a short heading +
 * pitch wrapped around the shared PreferredSourceButton, for the high-visibility
 * spots (end of blog articles, homepage) where the footer link alone goes unseen.
 * Server component — no client JS beyond the button itself.
 *
 * Strings share the `footer.preferredSource` namespace (kept together with the
 * button's label/aria — the namespace is historical, not footer-specific). The
 * bg-card/85 base keeps the light text legible over the fixed cover/background
 * images in dark mode; the primary sheen lives on its own layer because a
 * bg-gradient class alongside bg-card would make tailwind-merge drop one of them.
 */
export async function PreferredSourcePrompt({ className }: PreferredSourcePromptProps) {
  const t = await getTranslations('footer.preferredSource');

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl border p-6 backdrop-blur-md sm:p-7',
        'border-primary/25 bg-card/85',
        className
      )}
    >
      {/* branded gradient sheen on its own layer (see note above) */}
      <div
        className="from-primary/10 via-primary/5 pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-foreground text-lg font-bold">{t('promptTitle')}</h2>
          <p className="text-muted-foreground text-sm">{t('promptText')}</p>
        </div>
        <PreferredSourceButton className="shrink-0" />
      </div>
    </section>
  );
}
