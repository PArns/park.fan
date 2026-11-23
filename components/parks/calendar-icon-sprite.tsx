'use client';

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import { Check, Star, type LucideIcon } from 'lucide-react';
import type { ParkSeasonKind } from '@/lib/api/types';
import { knownSeasonKind, SEASON_KIND_ICON, seasonIconClass } from './season-kind-icon';

/**
 * The icons a crowd calendar draws on hundreds of tiles: the star, the hub's tick on a picked day and
 * every season kind's.
 */
const SPRITE_ICONS: Record<string, LucideIcon> = {
  star: Star,
  check: Check,
  ...Object.fromEntries(
    Object.entries(SEASON_KIND_ICON).map(([kind, { icon }]) => [`season-${kind}`, icon])
  ),
};

/** A name in {@link CalendarIconSprite}. */
export type CalendarIconName = 'star' | 'check' | `season-${ParkSeasonKind}`;

const spriteId = (name: CalendarIconName) => `calendar-icon-${name}`;

const SpriteContext = createContext(false);

/**
 * Each calendar icon once, as a `<symbol>`, for the tiles below it to `<use>`: a hub's thirty
 * days or a park's month carries one copy of each path instead of one per tile. Its children
 * read the sprite through {@link CalendarIcon}; outside it, that draws the icon inline.
 */
export function CalendarIconSprite({ children }: { children: ReactNode }) {
  return (
    <SpriteContext value>
      <svg aria-hidden className="hidden">
        {Object.entries(SPRITE_ICONS).map(([name, Icon]) => (
          <symbol key={name} id={spriteId(name as CalendarIconName)} viewBox="0 0 24 24">
            {/* `inherit`, from the `<use>`'s icon: `none` there, or `fill-current` for the star. */}
            <Icon fill="inherit" />
          </symbol>
        ))}
      </svg>
      {children}
    </SpriteContext>
  );
}

/**
 * A calendar icon: a `<use>` of its symbol inside {@link CalendarIconSprite}, else the lucide icon
 * itself, with the same attributes either way, so the two draw the same pixels.
 */
export function CalendarIcon({
  name,
  ...props
}: { name: CalendarIconName } & ComponentProps<'svg'>) {
  const inSprite = useContext(SpriteContext);
  const Icon = SPRITE_ICONS[name];
  if (!inSprite) return <Icon {...props} />;
  // Lucide hides an icon from assistive technology unless it is given a name or a role.
  const named = Object.keys(props).some((key) => key.startsWith('aria-') || key === 'role');
  return (
    <svg fill="none" {...(named ? {} : { 'aria-hidden': true })} {...props}>
      <use href={`#${spriteId(name)}`} />
    </svg>
  );
}

/** {@link CalendarIcon} for a season kind, in its colour: decoration beside a name the reader has. */
export function CalendarSeasonIcon({
  kind,
  className,
}: {
  kind: ParkSeasonKind;
  className?: string;
}) {
  return (
    <CalendarIcon
      name={`season-${knownSeasonKind(kind)}`}
      className={seasonIconClass(kind, className)}
    />
  );
}
