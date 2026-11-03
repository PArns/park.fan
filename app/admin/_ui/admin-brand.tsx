import { cn } from '@/lib/utils';
import { BrandPin, BrandWordmark } from '@/components/layout/brand-lockup';

/** Pin, wordmark and the label's text size for each place the admin shows its name. */
const SIZES = {
  md: { pin: 'h-[26px] w-auto', word: 'h-[17px] w-auto', label: 'text-[10px] px-1.5 py-px' },
  lg: { pin: 'h-10 w-auto', word: 'h-[26px] w-auto', label: 'text-[11px] px-2 py-0.5' },
} as const;

/**
 * The admin's name: the site's own lockup (pin and wordmark, light ink, since the admin is always
 * dark) with an „Admin“ label beside it. `md` heads the sidebar and the standalone pages, `lg` the
 * login; `pinOnly` is the collapsed sidebar rail.
 */
export function AdminBrand({
  size = 'md',
  pinOnly = false,
  className,
}: {
  size?: keyof typeof SIZES;
  pinOnly?: boolean;
  className?: string;
}) {
  const sizes = SIZES[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <BrandPin forceLight className={sizes.pin} />
      {!pinOnly && (
        <>
          <BrandWordmark forceLight className={sizes.word} />
          <span
            className={cn(
              'text-muted-foreground rounded-md border border-white/10 bg-white/[0.06] font-semibold tracking-[0.14em] uppercase',
              sizes.label
            )}
          >
            Admin
          </span>
        </>
      )}
      <span className="sr-only">park.fan Admin</span>
    </span>
  );
}
