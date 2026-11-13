import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PhotoCredit, TILE_CREDIT_POSITION } from '@/components/media/photo-credit';
import type { MoreMenuPhoto } from '@/lib/navigation/more-menu';

/**
 * A hub's photo filling a banner. A fixed size rather than `fill`, for the reason the news panel
 * gives: the bands ship `hidden` on every page, and `fill` lists every configured width in its
 * srcset. 480 is the widest a band's column gets (a 1536 px bar); the 2x candidate covers the rest.
 * The credit is the caller's, drawn over the scrim.
 */
export function HubBannerPhoto({ photo }: { photo: MoreMenuPhoto | null }) {
  if (!photo) return null;
  return (
    <Image
      src={photo.src}
      alt=""
      width={480}
      height={160}
      style={photo.position ? { objectPosition: photo.position } : undefined}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

/**
 * The head of a column in a header band: the hub's picture with its name, mark and one line on it,
 * all of it the hub's link. The scrim is weighted to the lower half because the name sits mid-photo
 * and white text needs 4.5 : 1 over the lightest photos. `h-32` at every width, so a narrow column
 * does not push the list down for sky. A missing photo leaves a dark tile under the same scrim.
 * `art` replaces the photo and its credit (the planner band's region scenes, which draw their own
 * fallback).
 */
export function HubBanner({
  href,
  icon: Icon,
  label,
  hint,
  count,
  photo,
  art,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
  count?: number;
  photo: MoreMenuPhoto | null;
  art?: React.ReactNode;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="group focus-visible:ring-ring relative block h-32 overflow-hidden rounded-xl bg-neutral-800 focus-visible:ring-2 focus-visible:outline-none"
    >
      {art ?? <HubBannerPhoto photo={photo} />}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 via-45% to-black/0"
      />
      <PhotoCredit src={art ? undefined : photo?.src} className={TILE_CREDIT_POSITION} />
      <span className="absolute inset-x-3.5 bottom-3 flex flex-col gap-1">
        <span className="flex items-center gap-2 text-white">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span className="text-[15px] leading-tight font-semibold">{label}</span>
          {count != null && <span className="text-xs text-white/75 tabular-nums">{count}</span>}
        </span>
        {/* Two lines reserved whether the hint needs them or not, so the names stand on one line
            across a band: the text is anchored to the foot of the photo. */}
        <span className="line-clamp-2 min-h-[2lh] text-xs leading-snug text-pretty text-white/85">
          {hint}
        </span>
      </span>
    </Link>
  );
}
