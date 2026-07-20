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
 * button's label/aria — the namespace is historical, not footer-specific). Uses the
 * same bg-card/85 glass recipe as ContributeBanner so the light text keeps its
 * contrast over the fixed cover/background images in dark mode.
 */
export async function PreferredSourcePrompt({ className }: PreferredSourcePromptProps) {
  const t = await getTranslations('footer.preferredSource');

  return (
    <section
      className={cn(
        'rounded-2xl border p-6 sm:p-7',
        'border-primary/25 bg-card/85 from-primary/10 via-primary/5 bg-gradient-to-br to-transparent backdrop-blur-md',
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h2 className="text-foreground text-lg font-bold">{t('promptTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t('promptText')}</p>
      </div>
      <PreferredSourceButton className="shrink-0" />
    </section>
  );
}
