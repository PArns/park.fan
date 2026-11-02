import Image from 'next/image';
import { cn } from '@/lib/utils';

/** The screenshots' size: an iPhone 13 viewport at 3× (`scripts/capture-parky-shots.mjs`). */
const SHOT = { width: 1170, height: 1992 };

/**
 * One of the screenshots in a phone, with a soft glow of the brand colours behind it, tilted a
 * little from `md` up. `tilt` leans it the other way, for a row that runs the other way.
 */
export function PhoneShot({
  src,
  alt,
  label,
  tilt = 'left',
  priority = false,
}: {
  src: string;
  alt: string;
  /** What the picture is, for the small badge on the frame. */
  label: string;
  tilt?: 'left' | 'right';
  priority?: boolean;
}) {
  return (
    <figure
      className={cn(
        'relative mx-auto w-[min(17.5rem,78vw)] transition-transform duration-500 motion-reduce:transition-none',
        tilt === 'left' ? 'md:-rotate-2 md:hover:rotate-0' : 'md:rotate-2 md:hover:rotate-0'
      )}
    >
      <div
        aria-hidden="true"
        className="from-primary/35 to-status-operating/35 absolute -inset-8 rounded-[3.5rem] bg-gradient-to-br blur-3xl"
      />
      <div className="relative overflow-hidden rounded-[2.6rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-white/15">
        {/* The island at the top of the screen, as on the phone the screenshots come from. */}
        <span
          aria-hidden="true"
          className="absolute top-2 left-1/2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-neutral-900"
        />
        <Image
          src={src}
          alt={alt}
          width={SHOT.width}
          height={SHOT.height}
          sizes="(max-width: 768px) 78vw, 280px"
          priority={priority}
          className="block h-auto w-full"
        />
      </div>
      <figcaption className="bg-background/90 border-border/60 text-muted-foreground absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide uppercase shadow-sm backdrop-blur">
        {label}
      </figcaption>
    </figure>
  );
}
