'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * "This is the ride's photo" — one switch, with the photo it replaces in view.
 *
 * It used to be a chip reading `ride-card` among the other roles, and ticking it
 * added the role without taking it from the photo that already had it. The
 * save now moves the role (`@/lib/admin/media-unique-roles`), so the switch has
 * to say what it will move it away from: the current card, by name and as a
 * thumbnail, so the decision is made with both pictures on screen.
 *
 * The current card is read from the build-time manifest through
 * `/api/admin/media` — what `main` shows on the ride page today. A card chosen
 * earlier in the open media session is not in it yet; the save finds that one
 * on the branch all the same.
 */

interface Card {
  id: string;
  url: string;
}

/**
 * One request per ride for the life of the page. The answer comes from the
 * manifest, which only changes with a deploy, and a walkthrough asks the same
 * question once per photo of the same ride.
 */
const cardsByRide = new Map<string, Promise<Card[]>>();

function currentCards(park: string, ride: string): Promise<Card[]> {
  const key = `${park}/${ride}`;
  let pending = cardsByRide.get(key);
  if (!pending) {
    pending = fetch(`/api/admin/media?${new URLSearchParams({ park, ride, role: 'ride-card' })}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: { images?: Array<Card & { roles: string[] }> }) =>
        (data.images ?? [])
          .filter((image) => image.roles.includes('ride-card'))
          .map(({ id, url }) => ({ id, url }))
      )
      .catch(() => {
        // Not cached: the next photo of the batch asks again.
        cardsByRide.delete(key);
        return [];
      });
    cardsByRide.set(key, pending);
  }
  return pending;
}

export function RideCardToggle({
  park,
  ride,
  self,
  active,
  onChange,
}: {
  park: string | null | undefined;
  ride: string | null | undefined;
  /** The image being edited, when it is already in the database. */
  self?: string;
  active: boolean;
  onChange: (next: boolean) => void;
}) {
  const key = park && ride ? `${park}/${ride}` : null;
  const [answer, setAnswer] = useState<{ key: string; cards: Card[] } | null>(null);

  useEffect(() => {
    if (!park || !ride) return;
    let cancelled = false;
    void currentCards(park, ride).then((cards) => {
      if (!cancelled) setAnswer({ key: `${park}/${ride}`, cards });
    });
    return () => {
      cancelled = true;
    };
  }, [park, ride]);

  const others =
    key && answer?.key === key ? answer.cards.filter((card) => card.id !== self) : null;

  let line: string;
  if (!key) line = 'Erst Park und Ride setzen.';
  else if (others === null) line = 'Aktuelles Ride-Bild wird gesucht…';
  else if (!others.length) {
    line = active
      ? `Wird das Bild von ${ride}.`
      : `${ride} hat kein festes Ride-Bild. Ohne eins zeigt die Seite das erste Foto des Rides.`;
  } else if (active) {
    line = `Ersetzt beim Speichern ${others.map((card) => card.id).join(', ')}.`;
  } else {
    line = `Aktuell: ${others.map((card) => card.id).join(', ')}`;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={!key}
        onClick={() => onChange(!active)}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40',
          active
            ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
            : 'border-border hover:border-foreground'
        )}
      >
        <Star className={cn('h-4 w-4', active && 'fill-current')} />
        {active ? 'Ride-Bild' : 'Als Ride-Bild setzen'}
      </button>
      {others?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of a database image
        <img
          src={others[0].url}
          alt=""
          className={cn('h-9 w-12 shrink-0 rounded object-cover', active && 'opacity-40 grayscale')}
        />
      )}
      <p className="text-muted-foreground min-w-0 text-[11px] break-words">{line}</p>
    </div>
  );
}
