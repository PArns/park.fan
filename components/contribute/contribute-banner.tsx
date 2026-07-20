import { getTranslations } from 'next-intl/server';
import { Camera, ChevronRight, ImageUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface ContributeBannerProps {
  /** Where the CTA points. Defaults to the contribution page. */
  href?: string;
  className?: string;
}

/**
 * Reusable call-to-action banner inviting visitors to upload their park/ride
 * photos. Drop it on the homepage, a park page, or an attraction page. Server
 * component (async) so it adds no client JS — it's just a styled localized link.
 */
export async function ContributeBanner({ href = '/contribute', className }: ContributeBannerProps) {
  const t = await getTranslations('contribute.banner');

  return (
    <Link
      href={href}
      className={cn(
        'group relative block overflow-hidden rounded-2xl border p-6 transition-all sm:p-8',
        // Semi-opaque themed base so the light text keeps its contrast in dark mode: on
        // park/ride pages this panel floats over the (often bright) background image, and a
        // pure primary-tinted glass washed the text out. The gradient tint layers on top.
        'border-primary/25 bg-card/85 from-primary/10 via-primary/5 bg-gradient-to-br to-transparent',
        'hover:border-primary/50 backdrop-blur-md hover:shadow-lg',
        className
      )}
    >
      {/* decorative camera glyph */}
      <Camera
        className="text-primary/10 pointer-events-none absolute -top-4 -right-4 size-32 -rotate-12 transition-transform duration-500 group-hover:rotate-0"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="bg-primary/15 text-primary flex size-14 shrink-0 items-center justify-center rounded-xl">
          <ImageUp className="size-7" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            {t('eyebrow')}
          </p>
          <h2 className="text-foreground text-xl font-bold sm:text-2xl">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
        <span className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-transform group-hover:translate-x-0.5">
          {t('cta')}
          <ChevronRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
