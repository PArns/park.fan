'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { LiveParkSnapshot } from '@/lib/api/parks';
import { useLiveParkData } from '@/lib/hooks/use-live-park-data';
import { pickRandom } from '@/lib/utils/pick-random';
import { parkPageOf, parkPathOf } from './easter-eggs';
import { LIVE_LINES, liveActDue, liveChange } from './live';
import type { ParkyPlay } from './acts';
import {
  answeredWithLine,
  countAnswer,
  countReaction,
  linesMuted,
  reactionsShown,
  REACTIONS_PER_SESSION,
} from '../teaser-store';

const noPark = { continent: '', country: '', city: '', parkSlug: '' };

/** The page's park as Parky names its rides. */
type ParkTarget = NonNullable<ReturnType<typeof parkPageOf>>;

/**
 * Parky watches the live waits of the park whose page this is, from the poll the page runs anyway
 * (React Query's cache, no request of its own). When a poll changes something he notices
 * (`liveChange`), he plays its act, at most once every `LIVE_ACT_GAP_MS`. A headliner going down
 * or its queue dropping sharply also gets a line once a session each, never over another line:
 * the ride down points at the bell on its card. The lines count against the session's reactions
 * and stay away once lines were closed by hand.
 */
export function useParkyLive({
  entering,
  busy,
  say,
  act,
  headliners,
}: {
  /** An entrance is under way: no line until Parky has landed. */
  entering: boolean;
  /** Whether a line now would interrupt something. */
  busy: () => boolean;
  say: (text: string) => void;
  act: (act: ParkyPlay) => void;
  /** The rides Parky calls the park's headliners (`headlinersOf`). */
  headliners: (target: ParkTarget) => Promise<string[]>;
}): void {
  const t = useTranslations('assistant');
  const pathname = usePathname();
  const target = parkPageOf(pathname);
  const path = target ? parkPathOf(pathname) : null;
  const { data } = useLiveParkData({ ...(target ?? noPark), enabled: false });
  const park = path ? (data as unknown as LiveParkSnapshot | undefined) : undefined;

  const latest = useRef({ entering, busy, say, act, headliners, target });
  useEffect(() => {
    latest.current = { entering, busy, say, act, headliners, target };
  });
  const before = useRef<{ path: string; park: LiveParkSnapshot } | null>(null);
  const lastAct = useRef<number | null>(null);
  useEffect(() => {
    if (!park || !path) return;
    const prev = before.current;
    before.current = { path, park };
    // The first reading on a page is where Parky starts from, not a change.
    if (!prev || prev.path !== path || prev.park === park) return;
    let live = true;
    const { target: page, headliners: namesOf } = latest.current;
    if (!page) return;
    namesOf(page).then((names) => {
      if (!live) return;
      const change = liveChange(prev.park, park, names);
      if (!change) return;
      const { entering, busy, say, act } = latest.current;
      const kind = `live-${change.kind}`;
      const speaks =
        (change.kind === 'down' || change.kind === 'drop') &&
        !entering &&
        !busy() &&
        !linesMuted() &&
        !answeredWithLine(kind) &&
        reactionsShown() < REACTIONS_PER_SESSION;
      const now = Date.now();
      if (!speaks && !liveActDue(lastAct.current, now)) return;
      lastAct.current = now;
      const line = pickRandom(LIVE_LINES[change.kind]);
      act(line.act);
      if (!speaks) return;
      countAnswer(kind);
      countReaction();
      say(t(line.key, { ride: change.ride ?? '', wait: change.wait ?? 0 }));
    });
    return () => {
      live = false;
    };
  }, [park, path, t]);
}
