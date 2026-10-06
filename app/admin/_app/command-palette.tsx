'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarRange,
  ExternalLink,
  LogOut,
  MapPin,
  RefreshCw,
  RollerCoaster,
  Rows3,
  type LucideIcon,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Kbd } from '../_ui/primitives';
import { adminFetch } from '../_lib/api';
import type { AdminParkListItem } from '../_lib/types';

interface RideHit {
  id: string;
  name: string;
  upstreamName: string;
  slug: string;
  park: { id: string; name: string } | null;
}
import { visibleGroups } from './nav';
import { useSession } from './session';

/**
 * ⌘K, the practical way to reach one park or ride among thousands. It searches the admin's own
 * endpoints, which match the curated name too, where the public index waits for its next rebuild.
 */

interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
  keywords?: string;
}

/**
 * ⌘K dialog that searches parks and rides by upstream or curated name and lists the admin pages
 * and actions (reload, open park.fan, sign out). Searches start at two characters, debounced.
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { identity, signOut } = useSession();
  const [query, setQuery] = useState('');
  const [parks, setParks] = useState<AdminParkListItem[]>([]);
  const [rides, setRides] = useState<RideHit[]>([]);
  const [searching, setSearching] = useState(false);

  const groups = useMemo(() => visibleGroups(identity.role), [identity.role]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  // Debounced, and only from two characters: one character matches most of the
  // catalogue and the request would be thrown away by the next keystroke
  // anyway. Every state write happens inside the timer rather than in the
  // effect body — a synchronous setState there renders twice per keystroke.
  useEffect(() => {
    const term = query.trim();
    const controller = new AbortController();

    const timer = setTimeout(() => {
      if (term.length < 2) {
        setParks([]);
        setRides([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const encoded = encodeURIComponent(term);
      // Both in parallel: "taron" means the ride and "toverland" the park, and nobody should have
      // to say which first.
      Promise.allSettled([
        adminFetch<{ parks: AdminParkListItem[] }>(
          `/api/admin/content/parks?q=${encoded}&limit=6`,
          { signal: controller.signal }
        ),
        adminFetch<{ attractions: RideHit[] }>(
          `/api/admin/content/attractions?q=${encoded}&limit=8`,
          { signal: controller.signal }
        ),
      ])
        .then(([parkResult, rideResult]) => {
          setParks(parkResult.status === 'fulfilled' ? (parkResult.value.parks ?? []) : []);
          setRides(rideResult.status === 'fulfilled' ? (rideResult.value.attractions ?? []) : []);
        })
        .finally(() => setSearching(false));
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const actions: PaletteAction[] = useMemo(
    () => [
      {
        id: 'reload',
        label: 'Daten neu laden',
        hint: 'Alle Ansichten neu abfragen',
        icon: RefreshCw,
        keywords: 'refresh aktualisieren neu',
        run: () => {
          onOpenChange(false);
          router.refresh();
          window.dispatchEvent(new CustomEvent('admin:refresh'));
        },
      },
      {
        id: 'site',
        label: 'park.fan öffnen',
        hint: 'Die öffentliche Seite in einem neuen Tab',
        icon: ExternalLink,
        keywords: 'website live public',
        run: () => {
          onOpenChange(false);
          window.open('https://park.fan', '_blank', 'noopener');
        },
      },
      {
        id: 'signout',
        label: 'Abmelden',
        icon: LogOut,
        keywords: 'logout abmelden ausloggen',
        run: () => {
          onOpenChange(false);
          void signOut();
        },
      },
    ],
    [onOpenChange, router, signOut]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => {
        // Cleared here rather than in an effect on `open`: the reset belongs to
        // the act of closing, and an effect would run it during a render.
        if (!next) {
          setQuery('');
          setParks([]);
          setRides([]);
        }
        onOpenChange(next);
      }}
      title="Befehle"
      description="Seiten, Parks und Aktionen"
      // Filtering is ours: the park results come from the server already
      // matched, and cmdk's own scorer would then throw away results that do
      // not literally contain the typed string — which is most fuzzy matches.
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Park suchen, Seite öffnen, Aktion ausführen…"
        hint={<Kbd>esc</Kbd>}
      />
      <CommandList>
        <CommandEmpty>{searching ? 'Suche…' : 'Nichts gefunden.'}</CommandEmpty>

        {parks.length > 0 && (
          <CommandGroup heading="Parks">
            {parks.map((park) => (
              <CommandItem
                key={park.id}
                value={`park-${park.id}`}
                onSelect={() => go(`/admin/parks/${park.id}`)}
              >
                <MapPin className="h-4 w-4" />
                <span className="flex-1 truncate">
                  {park.name}
                  {park.name !== park.upstreamName && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      (Upstream: {park.upstreamName})
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {[park.city, park.countryCode].filter(Boolean).join(', ')}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {rides.length > 0 && (
          <CommandGroup heading="Fahrgeschäfte">
            {rides.map((ride) => (
              <CommandItem
                key={ride.id}
                value={`ride-${ride.id}`}
                onSelect={() => go(`/admin/attractions/${ride.id}`)}
              >
                <RollerCoaster className="h-4 w-4" />
                <span className="flex-1 truncate">
                  {ride.name}
                  {ride.name !== ride.upstreamName && (
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      (Upstream: {ride.upstreamName})
                    </span>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {ride.park?.name ?? ''}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchingNav(groups, query).map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem key={item.href} value={item.href} onSelect={() => go(item.href)}>
                <item.icon className="h-4 w-4" />
                <span className="flex-1 truncate">
                  {item.label}
                  {item.description && (
                    <span className="text-muted-foreground ml-1.5 text-xs">{item.description}</span>
                  )}
                </span>
                <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Aktionen">
          {actions
            .filter((action) => matches(query, `${action.label} ${action.keywords ?? ''}`))
            .map((action) => (
              <CommandItem key={action.id} value={action.id} onSelect={action.run}>
                <action.icon className="h-4 w-4" />
                <span className="flex-1 truncate">{action.label}</span>
                {action.hint && (
                  <span className="text-muted-foreground shrink-0 text-xs">{action.hint}</span>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        {query.trim().length === 0 && (
          <CommandGroup heading="Tipp">
            <CommandItem value="tip" disabled>
              <Rows3 className="h-4 w-4" />
              <span className="text-muted-foreground flex-1 text-xs">
                Tippe zwei Buchstaben: Parks und Fahrgeschäfte werden zugleich gesucht, auch unter
                ihrem kuratierten Namen.
              </span>
            </CommandItem>
            <CommandItem value="tip-seasons" disabled>
              <CalendarRange className="h-4 w-4" />
              <span className="text-muted-foreground flex-1 text-xs">
                <Kbd>g</Kbd> <Kbd>p</Kbd> springt zu den Parks, <Kbd>g</Kbd> <Kbd>s</Kbd> zu den
                Saisons.
              </span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

/** Word-prefix matching, which is what people expect from a palette. */
function matches(query: string, haystack: string): boolean {
  const term = query.trim().toLowerCase();
  if (term.length === 0) return true;
  return haystack.toLowerCase().includes(term);
}

function matchingNav(
  groups: ReturnType<typeof visibleGroups>,
  query: string
): ReturnType<typeof visibleGroups> {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        matches(query, `${item.label} ${item.description ?? ''} ${(item.keywords ?? []).join(' ')}`)
      ),
    }))
    .filter((group) => group.items.length > 0);
}
