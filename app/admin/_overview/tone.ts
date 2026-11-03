import {
  BarChart3,
  Brain,
  CircleCheck,
  CircleHelp,
  Contrast,
  HeartPulse,
  ImageIcon,
  ListChecks,
  OctagonAlert,
  Server,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import type { HealthAreaId, HealthTone } from '@/lib/admin/health';

/**
 * The overview's words, icons and colours for a health tone and for each area, so the hero, the
 * problem cards and the area table say „Achtung“ with the same icon in the same amber.
 */

/** A tone as the overview says and draws it. */
export const TONE_META: Record<
  HealthTone,
  { word: string; icon: LucideIcon; text: string; tile: string; border: string; glow: string }
> = {
  ok: {
    word: 'Läuft',
    icon: CircleCheck,
    text: 'text-emerald-400',
    tile: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
    border: 'border-emerald-400/15',
    glow: 'var(--color-emerald-500)',
  },
  warn: {
    word: 'Achtung',
    icon: Contrast,
    text: 'text-amber-300',
    tile: 'bg-amber-400/12 text-amber-300 ring-amber-400/30',
    border: 'border-amber-400/20',
    glow: 'var(--color-amber-500)',
  },
  bad: {
    word: 'Gestört',
    icon: OctagonAlert,
    text: 'text-red-400',
    tile: 'bg-red-500/15 text-red-300 ring-red-500/35',
    border: 'border-red-500/25',
    glow: 'var(--color-red-500)',
  },
  unknown: {
    word: 'Unklar',
    icon: CircleHelp,
    text: 'text-muted-foreground',
    tile: 'bg-white/[0.06] text-muted-foreground ring-white/10',
    border: 'border-white/[0.07]',
    glow: 'var(--color-primary)',
  },
};

/** Each area's icon and the colour of its tile in the table. */
export const AREA_META: Record<HealthAreaId | 'contributions', { icon: LucideIcon; tile: string }> =
  {
    server: { icon: Server, tile: 'bg-indigo-400/12 text-indigo-300 ring-indigo-400/25' },
    feeds: { icon: Timer, tile: 'bg-sky-400/12 text-sky-300 ring-sky-400/25' },
    queues: { icon: ListChecks, tile: 'bg-violet-400/12 text-violet-300 ring-violet-400/25' },
    models: { icon: Brain, tile: 'bg-pink-400/12 text-pink-300 ring-pink-400/25' },
    statistic: { icon: BarChart3, tile: 'bg-teal-400/12 text-teal-300 ring-teal-400/25' },
    quality: { icon: HeartPulse, tile: 'bg-orange-400/12 text-orange-300 ring-orange-400/25' },
    contributions: { icon: ImageIcon, tile: 'bg-lime-400/12 text-lime-300 ring-lime-400/25' },
  };
