import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PhoneShot } from '@/components/marketing/phone-shot';

/**
 * A chapter's text beside a screenshot in a phone, the two swapping sides from row to row
 * (`reverse`), so a page of them reads as a zigzag rather than a column. Parky's page and the
 * homepage's tour draw their rows with it.
 */
export function ShotRow({
  children,
  src,
  alt,
  label,
  reverse = false,
  drift = false,
}: {
  /** The text column. */
  children: ReactNode;
  src: string;
  alt: string;
  /** What the picture is, for the small badge on the frame. */
  label: string;
  reverse?: boolean;
  /** The phone glides a little against the page while it scrolls past (`.pk-shot-drift`). */
  drift?: boolean;
}) {
  return (
    <div className="grid items-center gap-14 md:grid-cols-2 md:gap-12">
      <div className={cn('space-y-6', reverse && 'md:order-2')}>{children}</div>
      <div className={cn(drift && 'pk-shot-drift')}>
        <PhoneShot src={src} alt={alt} label={label} tilt={reverse ? 'left' : 'right'} />
      </div>
    </div>
  );
}
