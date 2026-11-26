import Image from 'next/image';
import { cn } from '@/lib/utils';

/** The screenshots' size: an iPhone 17's screen under its status bar at 3× (`scripts/lib/phone-device.mjs`). */
const SHOT = { width: 1206, height: 2436 };

/**
 * One of the screenshots in a phone, with a soft glow of the brand colours behind it, tilted a
 * little from `md` up. `tilt` leans it the other way, for a row that runs the other way; `none`
 * stands it upright, for phones side by side.
 */
export function PhoneShot({
  src,
  alt,
  tilt = 'left',
  priority = false,
  size,
}: {
  src: string;
  alt: string;
  tilt?: 'left' | 'right' | 'none';
  priority?: boolean;
  /**
   * A capture of the whole screen at its own size, status bar and island included (the iPhone
   * app's, `public/media/app/`), so no bar is drawn over it. Without it: the site's screenshots.
   */
  size?: { width: number; height: number };
}) {
  return (
    <figure
      className={cn(
        'relative mx-auto w-[min(17.5rem,78vw)] transition-transform duration-500 motion-reduce:transition-none',
        tilt === 'left' && 'md:-rotate-2 md:hover:rotate-0',
        tilt === 'right' && 'md:rotate-2 md:hover:rotate-0'
      )}
    >
      <div
        aria-hidden="true"
        className="from-primary/35 to-status-operating/35 absolute -inset-8 rounded-[3.5rem] bg-gradient-to-br blur-3xl"
      />
      <div className="relative overflow-hidden rounded-[2.6rem] border-[7px] border-neutral-900 bg-neutral-900 shadow-2xl ring-1 ring-white/15">
        {/* The status bar with its island, 62 of the screen's 402 px, which the screenshots leave
          out (`STATUS_BAR`), so the page's header starts below it as on the phone. */}
        {!size && (
          <div
            aria-hidden="true"
            className="flex aspect-[402/62] items-center justify-center bg-black"
          >
            <span className="h-[58%] w-[31%] rounded-full bg-neutral-900" />
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          width={(size ?? SHOT).width}
          height={(size ?? SHOT).height}
          sizes="(max-width: 768px) 78vw, 280px"
          priority={priority}
          className="block h-auto w-full"
        />
      </div>
    </figure>
  );
}
