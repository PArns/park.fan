'use client';

import Link from 'next/link';
import {
  Activity,
  CalendarRange,
  History,
  Images,
  MapPin,
  PenLine,
  Server,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { adminKeys, useAdminQuery } from './_lib/api';
import type { AdminParkListItem, AuditEntry, ParkSeason } from './_lib/types';
import {
  ErrorState,
  Kbd,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from './_ui/primitives';
import { HistoryList } from './_ui/history-list';
import { useSession } from './_app/session';

/**
 * The first screen: what is going on, and what is worth doing next.
 *
 * Deliberately not a metrics wall. The system dashboards already exist and are
 * one click away; what this answers is the question somebody opening the admin
 * actually has — "did anything change since I was last here, and is there
 * anything obvious to fix". Both halves are lists rather than numbers, because
 * a number here would need a second click to become actionable and an
 * actionable list does not.
 */
export default function AdminDashboard() {
  const { identity } = useSession();

  const history = useAdminQuery<{ entries: AuditEntry[]; total: number }>(
    adminKeys.history({ limit: 12 }),
    '/api/admin/content/history?limit=12'
  );

  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ current: true }),
    '/api/admin/content/seasons?current=true&limit=20'
  );

  const uncurated = useAdminQuery<{ parks: AdminParkListItem[]; total: number }>(
    adminKeys.parks({ curated: 'none' }),
    '/api/admin/content/parks?curated=none&limit=6'
  );

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h1 className="text-xl font-bold">Hallo {identity.displayName.split(' ')[0]}</h1>
        <p className="text-muted-foreground text-sm">
          <Kbd>⌘K</Kbd> für alles, <Kbd>g</Kbd> <Kbd>p</Kbd> zu den Parks.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <PanelHeader
              icon={History}
              title="Zuletzt geändert"
              hint="Kuratierungen, Saisons, ausgelöste Jobs"
              action={
                <Link href="/admin/history" className="text-primary text-xs hover:underline">
                  alles ansehen
                </Link>
              }
            />
            {history.isError ? (
              <ErrorState message={history.error.message} />
            ) : history.isLoading ? (
              <SkeletonRows rows={5} />
            ) : (
              <PanelBody>
                <HistoryList entries={history.data?.entries ?? []} compact showEntity />
              </PanelBody>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              icon={MapPin}
              title="Noch nie kuratiert"
              hint="Parks, an denen niemand etwas korrigiert hat — nicht zwingend ein Problem, aber ein guter Startpunkt"
            />
            {uncurated.isError ? (
              <ErrorState message={uncurated.error.message} />
            ) : uncurated.isLoading ? (
              <SkeletonRows rows={4} />
            ) : (
              <PanelBody className="space-y-1">
                {(uncurated.data?.parks ?? []).map((park) => (
                  <Link
                    key={park.id}
                    href={`/admin/parks/${park.id}`}
                    className="hover:bg-muted/30 flex items-center gap-3 rounded-lg px-2 py-1.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{park.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {park.attractionCount} Bahnen
                    </span>
                  </Link>
                ))}
                {(uncurated.data?.total ?? 0) > 6 && (
                  <Link
                    href="/admin/parks"
                    className="text-primary block px-2 pt-1 text-xs hover:underline"
                  >
                    und {(uncurated.data?.total ?? 0) - 6} weitere
                  </Link>
                )}
              </PanelBody>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              icon={CalendarRange}
              title="Läuft gerade"
              hint="Saisons, die heute aktiv sind"
              action={
                <Link href="/admin/seasons" className="text-primary text-xs hover:underline">
                  alle
                </Link>
              }
            />
            {seasons.isLoading ? (
              <SkeletonRows rows={3} />
            ) : (seasons.data?.seasons.length ?? 0) === 0 ? (
              <PanelBody>
                <p className="text-muted-foreground text-xs">
                  Heute läuft nichts Eingetragenes. Wenn das falsch ist, fehlt der
                  Eintrag — es gibt keine Quelle, aus der er von selbst käme.
                </p>
              </PanelBody>
            ) : (
              <PanelBody className="space-y-2">
                {(seasons.data?.seasons ?? []).slice(0, 8).map((season) => (
                  <Link
                    key={season.id}
                    href={`/admin/parks/${season.parkId}#seasons`}
                    className="hover:bg-muted/30 block rounded-lg px-2 py-1.5"
                  >
                    <p className="truncate text-sm">{season.name ?? season.kind}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {season.park?.name ?? ''}
                    </p>
                  </Link>
                ))}
              </PanelBody>
            )}
          </Panel>

          <Panel>
            <PanelHeader icon={Sparkles} title="Schnellzugriff" />
            <PanelBody className="grid grid-cols-2 gap-2">
              <QuickLink href="/admin/parks" icon={MapPin} label="Parks" />
              <QuickLink href="/admin/seasons" icon={CalendarRange} label="Saisons" />
              <QuickLink href="/admin/media" icon={Images} label="Medien" />
              <QuickLink href="/admin/blog-editor" icon={PenLine} label="Blog" />
              <QuickLink href="/admin/system" icon={Server} label="System" />
              <QuickLink href="/admin/analytics" icon={Activity} label="Analytics" />
            </PanelBody>
          </Panel>

          {identity.legacy && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Du bist über das geteilte Alt-Passwort angemeldet. Änderungen lassen
              sich damit niemandem zuordnen — leg dir ein Konto an.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="border-border/60 hover:border-primary/40 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs"
    >
      <Icon className="text-primary h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
