'use client';

import Link from 'next/link';
import { CalendarRange, History, MapPin, ShieldCheck, TriangleAlert } from 'lucide-react';
import { adminKeys, useAdminQuery } from './_lib/api';
import type { AdminOverview, AdminParkListItem, AuditEntry, ParkSeason } from './_lib/types';
import { useAdminHealth } from './_lib/use-admin-health';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SectionHeading,
  SkeletonRows,
} from './_ui/primitives';
import { HistoryList } from './_ui/history-list';
import { useCan, useSession } from './_app/session';
import { useRealtimeOverview } from './traffic/_lib/use-traffic';
import { StatusHero } from './_overview/status-hero';
import { ProblemList } from './_overview/problem-list';
import { AreaTable } from './_overview/area-table';
import { CatalogFigures, TodayFigures } from './_overview/figures';

/**
 * The first screen, read top to bottom as a situation report: one sentence on the state of
 * things, what needs a person (each with its button), the figures of the day, every part of the
 * system with its checks, the catalogue, and what changed lately.
 */
export default function AdminDashboard() {
  const { identity } = useSession();
  const canModerate = useCan('author');
  const { health, data, retry } = useAdminHealth({ live: true });
  const traffic = useRealtimeOverview();

  const history = useAdminQuery<{ entries: AuditEntry[]; total: number }>(
    adminKeys.history({ limit: 8 }),
    '/api/admin/content/history?limit=8'
  );
  const seasons = useAdminQuery<{ seasons: ParkSeason[]; total: number }>(
    adminKeys.seasons({ current: true }),
    '/api/admin/content/seasons?current=true&limit=20'
  );
  const uncurated = useAdminQuery<{ parks: AdminParkListItem[]; total: number }>(
    adminKeys.parks({ curated: 'none' }),
    '/api/admin/content/parks?curated=none&limit=5'
  );
  // One request for every catalogue number, so no card inherits the `limit` of a list it borrowed
  // a total from.
  const overview = useAdminQuery<AdminOverview>(
    ['admin', 'overview'],
    '/api/admin/content/overview',
    { staleTime: 60_000 }
  );

  return (
    <AdminPage width="wide" className="space-y-8 sm:pt-8">
      <StatusHero
        health={health}
        liveVisitors={traffic.data?.realtime.activeVisitors ?? null}
        pendingContributions={data.contributions?.pending.length ?? 0}
      />

      {health.problems.length > 0 && (
        <section aria-labelledby="overview-problems" className="space-y-3">
          <SectionHeading
            id="overview-problems"
            title="Wartet auf dich"
            count={health.problems.length}
            hint="Störungen zuerst, jede Karte mit ihrer Antwort"
          />
          <ProblemList problems={health.problems} onRetry={retry} />
        </section>
      )}

      <section aria-labelledby="overview-today" className="space-y-3">
        <SectionHeading id="overview-today" title="Heute" />
        <TodayFigures
          health={health}
          data={data}
          traffic={traffic.data}
          canModerate={canModerate}
        />
      </section>

      <section aria-labelledby="overview-areas" className="space-y-3">
        <SectionHeading
          id="overview-areas"
          title="Bereiche"
          hint="jeder Strich eine Prüfung, aufklappen für die Werte"
        />
        <AreaTable areas={health.areas} />
      </section>

      <section aria-labelledby="overview-catalog" className="space-y-3">
        <SectionHeading
          id="overview-catalog"
          title="Katalog"
          action={
            <Link href="/admin/parks" className="text-primary-ink text-[13px] hover:underline">
              Zu den Parks
            </Link>
          }
        />
        <CatalogFigures overview={overview.data} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            icon={History}
            title="Zuletzt geändert"
            hint="Kuratierungen, Saisons, ausgelöste Jobs"
            action={
              <Link href="/admin/history" className="text-primary-ink text-xs hover:underline">
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

        <div className="space-y-4">
          <Panel>
            <PanelHeader
              icon={CalendarRange}
              title="Läuft gerade"
              hint="Saisons, die heute aktiv sind"
              action={
                <Link href="/admin/seasons" className="text-primary-ink text-xs hover:underline">
                  alle
                </Link>
              }
            />
            {seasons.isLoading ? (
              <SkeletonRows rows={3} />
            ) : (seasons.data?.seasons?.length ?? 0) === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="Heute läuft nichts Eingetragenes"
                description="Wenn das falsch ist, fehlt der Eintrag: Es gibt keine Quelle, aus der er von selbst käme."
              />
            ) : (
              <PanelBody className="space-y-1">
                {(seasons.data?.seasons ?? []).slice(0, 6).map((season) => (
                  <Link
                    key={season.id}
                    href={`/admin/parks/${season.parkId}#seasons`}
                    className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
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
            <PanelHeader
              icon={MapPin}
              title="Noch nie kuratiert"
              hint="Ein guter Startpunkt, kein Fehler"
            />
            {uncurated.isError ? (
              <ErrorState message={uncurated.error.message} />
            ) : uncurated.isLoading ? (
              <SkeletonRows rows={4} />
            ) : (uncurated.data?.parks.length ?? 0) === 0 ? (
              <EmptyState icon={ShieldCheck} title="Jeder Park wurde schon einmal korrigiert" />
            ) : (
              <PanelBody className="space-y-0.5">
                {(uncurated.data?.parks ?? []).map((park) => (
                  <Link
                    key={park.id}
                    href={`/admin/parks/${park.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">{park.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {park.attractionCount} Bahnen
                    </span>
                  </Link>
                ))}
                {(uncurated.data?.total ?? 0) > 5 && (
                  <Link
                    href="/admin/parks?curated=none"
                    className="text-primary-ink block px-2 pt-1 text-xs hover:underline"
                  >
                    und {(uncurated.data?.total ?? 0) - 5} weitere
                  </Link>
                )}
              </PanelBody>
            )}
          </Panel>

          {identity.legacy && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Du bist über das geteilte Alt-Passwort angemeldet. Änderungen lassen sich damit
              niemandem zuordnen — leg dir ein Konto an.
            </p>
          )}
        </div>
      </div>
    </AdminPage>
  );
}
