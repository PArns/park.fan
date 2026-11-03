'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarRange,
  Camera,
  ImageIcon,
  Images,
  MapPin,
  PenLine,
  Radio,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminHealth } from '@/lib/admin/health';
import { heroObjectPosition } from '@/lib/media/hero';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { formatCount } from '@/lib/admin/site-analytics';
import { useHeroPhoto } from '../_lib/use-hero-photo';
import { formatDisplayName } from '../_lib/format';
import { Kbd } from '../_ui/primitives';
import { useSession } from '../_app/session';
import { useOpenPalette } from '../_app/admin-shell';
import { TONE_META } from './tone';

const DAY = getDateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Berlin',
});

/** `A, B und C`. */
function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} und ${words[words.length - 1]}`;
}

/** The hero's headline and the line under it, from the problems and the areas. */
function headline(health: AdminHealth): { title: string; summary: string } {
  const pending = health.areas.length > 0 && health.areas.every((a) => a.pending === 'loading');
  if (pending && health.problems.length === 0) {
    return { title: 'Einen Moment', summary: 'Server, Queues und Modelle werden gefragt.' };
  }
  const faults = health.problems.filter((p) => p.tone === 'bad').length;
  const waiting = health.problems.length - faults;
  if (health.problems.length === 0) {
    const named = health.areas.filter((a) => !a.pending).map((a) => a.label);
    return {
      title: 'Alles läuft',
      summary: named.length ? `${joinWords(named)}: nichts Auffälliges.` : 'Nichts Auffälliges.',
    };
  }
  const title =
    faults > 0
      ? faults === 1
        ? 'Eine Störung'
        : `${formatCount(faults)} Störungen`
      : waiting === 1
        ? 'Eine Sache wartet auf dich'
        : `${formatCount(waiting)} Dinge warten auf dich`;
  const lead = health.problems.slice(0, 2).map((p) => p.title);
  const rest = health.problems.length - lead.length;
  return {
    title,
    summary: rest > 0 ? `${lead.join(' · ')} · und ${formatCount(rest)} mehr` : lead.join(' · '),
  };
}

/**
 * The top of the overview: the state of things in one sentence, coloured by the worst problem,
 * over the rotating park photo, with the shortcuts an editor reaches for most underneath. The
 * camera comes first and fills the row on a phone, which is opened at a park gate.
 */
export function StatusHero({
  health,
  liveVisitors,
  pendingContributions,
}: {
  health: AdminHealth;
  /** Visitors on park.fan in the last five minutes; null until the counter answered. */
  liveVisitors: number | null;
  pendingContributions: number;
}) {
  const { identity } = useSession();
  const hero = useHeroPhoto();
  const now = useMinuteNow();
  const openPalette = useOpenPalette();
  const tone = TONE_META[health.tone];
  const { title, summary } = headline(health);
  const firstName = formatDisplayName(identity.displayName.split(' ')[0] ?? '');

  return (
    <section
      className={cn(
        'bg-card/60 relative isolate overflow-hidden rounded-2xl border p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] sm:p-7',
        tone.border
      )}
    >
      {/* The login screen's photo from the same window, faded in from the right so the text side
          stays the card's own surface. The box has its height from the content, so nothing moves
          when the image lands. */}
      {hero && (
        <Image
          src={hero.src}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 60rem, 100vw"
          style={{ objectPosition: heroObjectPosition(hero.src) }}
          className="animate-in fade-in -z-20 [mask-image:linear-gradient(to_right,transparent_30%,black_85%)] object-cover opacity-50 duration-1000 motion-reduce:animate-none"
        />
      )}
      <div
        aria-hidden="true"
        className="from-background/40 to-background/80 absolute inset-0 -z-10 bg-gradient-to-b"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          background: `radial-gradient(42rem 18rem at 0% 0%, ${tone.glow}, transparent 70%)`,
        }}
      />

      <div className="flex items-start gap-4">
        <span
          className={cn(
            'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1',
            tone.tile
          )}
        >
          {/* Three beats on arrival for a fault, then still: an endless pulse is work for a tab
              nobody looks at. */}
          {health.tone === 'bad' && (
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-xl bg-red-500/25 [animation-iteration-count:3] motion-reduce:hidden"
            />
          )}
          <tone.icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[13px]">
            {now !== null && <span>{DAY.format(now)} · </span>}
            Hallo {firstName}
          </p>
          <h2 className="mt-0.5 text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 line-clamp-2 max-w-2xl text-sm">{summary}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        <QuickChip
          href="/admin/capture"
          icon={Camera}
          accent
          className="max-sm:min-h-12 max-sm:w-full max-sm:justify-center"
        >
          Vor Ort fotografieren
        </QuickChip>
        {pendingContributions > 0 && (
          <QuickChip href="/admin/contributions" icon={ImageIcon} accent>
            {pendingContributions === 1
              ? 'Eine Einsendung prüfen'
              : `${formatCount(pendingContributions)} Einsendungen prüfen`}
          </QuickChip>
        )}
        <QuickChip href="/admin/parks" icon={MapPin}>
          Parks
        </QuickChip>
        <QuickChip href="/admin/seasons" icon={CalendarRange}>
          Saisons
        </QuickChip>
        <QuickChip href="/admin/blog-editor" icon={PenLine}>
          Blog
        </QuickChip>
        <QuickChip href="/admin/media" icon={Images}>
          Medien
        </QuickChip>
        <QuickChip href="/admin/traffic/live" icon={Radio}>
          Live
          {liveVisitors !== null && (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 tabular-nums">
              <span
                aria-hidden="true"
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  liveVisitors > 0 ? 'bg-emerald-400' : 'bg-muted-foreground/50'
                )}
              />
              {formatCount(liveVisitors)}
            </span>
          )}
        </QuickChip>
        <button
          type="button"
          onClick={openPalette}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[13px] transition-colors hover:border-white/15 hover:bg-white/[0.06]"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Alles andere
          <Kbd>⌘K</Kbd>
        </button>
      </div>

      {hero?.meta && (
        <p className="animate-in fade-in absolute top-3 right-3 hidden max-w-[40%] truncate rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white/70 duration-1000 motion-reduce:animate-none lg:block">
          {[hero.meta.attractionName, hero.meta.parkName].filter(Boolean).join(' · ')}
        </p>
      )}
    </section>
  );
}

/** A shortcut in the hero's row. `accent` marks the ones that start work rather than browse. */
function QuickChip({
  href,
  icon: Icon,
  accent = false,
  className,
  children,
}: {
  href: string;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[13px] transition-colors',
        accent
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:border-emerald-400/40 hover:bg-emerald-400/15'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]',
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('h-4 w-4 shrink-0', accent ? 'text-emerald-300' : 'text-muted-foreground')}
      />
      {children}
    </Link>
  );
}
