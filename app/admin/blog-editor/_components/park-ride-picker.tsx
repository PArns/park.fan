'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Sparkles, TrainFront, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PickerMode = 'park' | 'ride' | 'spotlight';

/** Inline-link options the blog renderer understands for `ref:` links. */
export type RefOption = 'info' | 'bare' | 'full';

export interface PickerResult {
  /**
   * The full geo path used inside the ref: token — e.g.
   * `/parks/europe/germany/bruehl/phantasialand` or `…/phantasialand/black-mamba`.
   * The renderer normalises this back to a bare slug at resolve time.
   */
  refKey: string;
  label: string;
  kind: 'park' | 'ride';
  /** For rides — the parent park's bare slug straight from the search hit.
   *  The URL has an intercalated `/attractions/` segment so deriving this
   *  from `refKey` alone is brittle; the search backend gives us the
   *  authoritative value. */
  parentParkSlug?: string;
  /** Inline only — spotlight always uses `?full`. */
  option: RefOption;
}

interface ParkRidePickerProps {
  mode: PickerMode | null;
  onPick: (result: PickerResult) => void;
  onClose: () => void;
  /** Bounding rect of whatever triggered the picker (panel button, chip).
   *  When supplied the modal floats near the trigger instead of always
   *  hovering at the top of the viewport. */
  anchorRect?: { top: number; bottom: number; left: number; right: number };
}

interface SearchHit {
  type: string;
  name: string;
  slug: string;
  url?: string;
  parentPark?: { name: string; slug: string };
}

interface SearchResponse {
  results?: SearchHit[];
}

/**
 * Turn a hit into the path used inside the ref: token. The search API returns
 * `/v1/parks/<continent>/<country>/<city>/<parkSlug>[/<rideSlug>]`; we strip
 * the version prefix so the path matches the actual frontend URL and authors
 * see something they recognise in the markdown source.
 */
function pathFromHit(hit: SearchHit): string | null {
  if (!hit.url) return null;
  return hit.url.replace(/^\/v\d+/, '');
}

/**
 * Combobox modal: searches /api/search for parks (and rides when needed),
 * shows up to 12 matches, and resolves the slug into a ref: key. Spotlight
 * mode shows both parks and rides since the author picks either kind for
 * a ?full card.
 */
export function ParkRidePicker({
  mode,
  onPick,
  onClose,
  anchorRect,
}: ParkRidePickerProps) {
  const [q, setQ] = useState('');
  const [option, setOption] = useState<RefOption>('info');
  const [hits, setHits] = useState<{ parks: SearchHit[]; rides: SearchHit[] }>({
    parks: [],
    rides: [],
  });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // preventScroll keeps the document pinned — the default `.focus()` was
    // yanking the viewport to the top when the picker mounted near the
    // bottom of a long page.
    if (mode) inputRef.current?.focus({ preventScroll: true });
  }, [mode]);

  useEffect(() => {
    // The search backend requires at least 3 chars (see /api/search/route.ts).
    if (!mode || q.trim().length < 3) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL('/api/search', window.location.origin);
        url.searchParams.set('q', q.trim());
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) return;
        const data = (await r.json()) as SearchResponse;
        const all = data.results ?? [];
        setHits({
          parks: all.filter((h) => h.type === 'park').slice(0, 8),
          rides: all.filter((h) => h.type === 'attraction').slice(0, 8),
        });
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, mode]);

  if (!mode) return null;

  const wantParks = mode === 'park' || mode === 'spotlight';
  const wantRides = mode === 'ride' || mode === 'spotlight';
  // Hide stale results when the box is empty so opening the picker fresh
  // doesn't show whatever was last searched.
  const visibleParks = wantParks && q.trim() ? hits.parks : [];
  const visibleRides = wantRides && q.trim() ? hits.rides : [];

  const choose = (hit: SearchHit, kind: 'park' | 'ride') => {
    const ref = pathFromHit(hit);
    if (!ref) return;
    onPick({
      refKey: ref,
      label: hit.name,
      kind,
      option,
      ...(kind === 'ride' && hit.parentPark?.slug
        ? { parentParkSlug: hit.parentPark.slug }
        : {}),
    });
  };

  // Anchor positioning — same scheme the ImagePicker uses. When a trigger
  // rect is supplied, place the modal near it on the side with more room so
  // the dialog never escapes the viewport.
  const DIALOG_HEIGHT = Math.min(560, window.innerHeight * 0.8);
  let modalStyle: React.CSSProperties = {};
  if (anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const placeBelow = spaceBelow >= 360 || spaceBelow >= spaceAbove;
    const top = placeBelow
      ? Math.max(
          16,
          Math.min(anchorRect.bottom + 12, window.innerHeight - DIALOG_HEIGHT - 16)
        )
      : Math.max(16, anchorRect.top - DIALOG_HEIGHT - 12);
    modalStyle = {
      position: 'fixed',
      top,
      left: Math.max(
        16,
        Math.min(
          window.innerWidth - 16 - 620,
          (anchorRect.left + anchorRect.right) / 2 - 310
        )
      ),
      width: 'min(620px, 92vw)',
      maxHeight: DIALOG_HEIGHT,
    };
  }

  return (
    <div
      className={
        anchorRect
          ? 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm'
          : 'fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={modalStyle}
        className={
          'border-border/60 bg-popover text-popover-foreground overflow-hidden rounded-2xl border shadow-2xl flex flex-col ' +
          (anchorRect ? '' : 'w-[min(620px,92vw)]')
        }
      >
        <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            placeholder={
              mode === 'park'
                ? 'Search a park…'
                : mode === 'ride'
                  ? 'Search a ride…'
                  : 'Search a park or ride for the spotlight card…'
            }
            className="text-foreground flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
          />
          {loading && (
            <span className="text-muted-foreground text-xs">searching…</span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-accent/40 rounded-md p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {mode !== 'spotlight' && (
          <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2 text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Variant
            </span>
            <div className="bg-muted/40 inline-flex overflow-hidden rounded-full p-0.5">
              {(
                [
                  { k: 'info', label: 'Info', hint: 'inline link · city/park + live badge' },
                  { k: 'bare', label: 'Bare', hint: 'inline link · no annotation' },
                  { k: 'full', label: 'Full', hint: 'block spotlight card (renders as its own paragraph)' },
                ] as Array<{ k: RefOption; label: string; hint: string }>
              ).map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setOption(o.k)}
                  title={o.hint}
                  className={cn(
                    'rounded-full px-2.5 py-0.5 font-semibold transition-colors',
                    option === o.k
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <span className="text-muted-foreground/70 ml-auto font-mono text-[10px]">
              ?{option}
            </span>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-1">
          {visibleParks.length === 0 && visibleRides.length === 0 && (
            <div className="text-muted-foreground p-6 text-center text-sm">
              {q.trim().length === 0
                ? 'Start typing to search.'
                : q.trim().length < 3
                  ? 'Keep typing — at least 3 characters.'
                  : loading
                    ? 'Searching…'
                    : 'No matches.'}
            </div>
          )}
          {visibleParks.length > 0 && (
            <Group label="Parks" icon={MapPin}>
              {visibleParks.map((h) => (
                <Row key={h.url} hit={h} onClick={() => choose(h, 'park')} />
              ))}
            </Group>
          )}
          {visibleRides.length > 0 && (
            <Group label="Rides" icon={TrainFront}>
              {visibleRides.map((h) => (
                <Row key={h.url} hit={h} onClick={() => choose(h, 'ride')} />
              ))}
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

function Group({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <div className="text-muted-foreground inline-flex items-center gap-1.5 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ hit, onClick }: { hit: SearchHit; onClick: () => void }) {
  const refKey = hit.url ? hit.url.replace(/^\/v\d+/, '') : hit.slug;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent/40 group flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors'
      )}
    >
      <div className="min-w-0">
        <div className="text-foreground text-sm font-medium leading-tight">{hit.name}</div>
        {hit.parentPark?.name && (
          <div className="text-muted-foreground text-xs leading-snug">at {hit.parentPark.name}</div>
        )}
      </div>
      <code className="text-muted-foreground/70 group-hover:text-muted-foreground font-mono text-[10px]">
        ref:{refKey}
      </code>
    </button>
  );
}
