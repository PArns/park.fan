'use client';

import Link from 'next/link';
import Image from 'next/image';
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
import { cn } from '@/lib/utils';
import { heroObjectPosition } from '@/lib/media/hero';
import { useHeroPhoto } from './_lib/use-hero-photo';
import { adminKeys, useAdminQuery } from './_lib/api';
import type { AdminParkListItem, AuditEntry, ParkSeason } from './_lib/types';
import { ErrorState, Kbd, Panel, PanelBody, PanelHeader, SkeletonRows } from './_ui/primitives';
import { HistoryList } from './_ui/history-list';
import { useSession } from './_app/session';
import { AdminPage } from './_ui/primitives';

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
  const hero = useHeroPhoto();

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
    <AdminPage width="wide">
      {/* The same photograph the login screen was showing a second ago.
          Both ask `useHeroPhoto` for the same half-hour window, so signing in
          does not throw away the picture somebody was just looking at — and a
          tool for editing theme parks gets to look like one. The band has a
          fixed height, so nothing moves when the image lands. */}
      <div className="border-border/60 relative h-32 overflow-hidden rounded-2xl border shadow-lg ring-1 shadow-black/20 ring-white/[0.03] sm:h-40">
        <div
          aria-hidden="true"
          className="from-primary/25 absolute inset-0 bg-gradient-to-br to-transparent"
        />
        {hero && (
          <Image
            src={hero.src}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 72rem, 100vw"
            style={{ objectPosition: heroObjectPosition(hero.src) }}
            className="animate-in fade-in object-cover duration-1000 motion-reduce:animate-none"
          />
        )}
        <div
          aria-hidden="true"
          className="from-background via-background/75 absolute inset-0 bg-gradient-to-r to-transparent"
        />
        {/* The greeting sits on this one. Without it the line of muted text
            beside the name lands on whatever the photo happens to be doing at
            that x, which on a bright picture is nothing legible. */}
        <div
          aria-hidden="true"
          className="from-background via-background/50 absolute inset-0 bg-gradient-to-t to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 p-4 sm:p-5">
          <h1 className="text-xl font-bold drop-shadow-[0_1px_10px_rgba(0,0,0,0.9)] sm:text-2xl">
            Hallo {identity.displayName.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            <Kbd>⌘K</Kbd> für alles, <Kbd>g</Kbd> <Kbd>p</Kbd> zu den Parks.
          </p>
        </div>

        {hero?.meta && (
          <p className="animate-in fade-in absolute right-3 bottom-3 hidden max-w-[45%] truncate rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-md duration-1000 motion-reduce:animate-none sm:block">
            {[hero.meta.attractionName, hero.meta.parkName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* Three numbers the page already has.
          Every one of these is the `total` of a query that runs below anyway,
          so this costs no request — and it answers at a glance what the lists
          under it answer after reading. They are counts, not a metrics wall:
          each one is a link to the list it counts. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat
          href="/admin/parks"
          icon={MapPin}
          label="Parks ohne Kuratierung"
          value={uncurated.data?.total}
          loading={uncurated.isLoading}
        />
        <Stat
          href="/admin/seasons"
          icon={CalendarRange}
          label="Saisons laufen heute"
          value={seasons.data?.total}
          loading={seasons.isLoading}
        />
        <Stat
          href="/admin/history"
          icon={History}
          label="Änderungen insgesamt"
          value={history.data?.total}
          loading={history.isLoading}
          className="col-span-2 sm:col-span-1"
        />
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
              hint="Parks, an denen niemand etwas korrigiert hat. Nicht zwingend ein Problem, aber ein guter Startpunkt"
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
            ) : (seasons.data?.seasons?.length ?? 0) === 0 ? (
              <PanelBody>
                <p className="text-muted-foreground text-xs">
                  Heute läuft nichts Eingetragenes. Wenn das falsch ist, fehlt der Eintrag, denn es
                  gibt keine Quelle, aus der er von selbst käme.
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
              Du bist über das geteilte Alt-Passwort angemeldet. Änderungen lassen sich damit
              niemandem zuordnen — leg dir ein Konto an.
            </p>
          )}
        </div>
      </div>
    </AdminPage>
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
      className="border-border/60 hover:border-primary/40 hover:bg-primary/5 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors"
    >
      <Icon className="text-primary h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

/**
 * One count, and where to go with it.
 *
 * The box keeps its height while the query is in flight — a tile that grows
 * from nothing when the number lands pushes the two lists under it down, and
 * these three resolve at three different moments.
 */
function Stat({
  href,
  icon: Icon,
  label,
  value,
  loading,
  className,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
  value: number | undefined;
  loading: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'border-border/60 bg-card/80 hover:border-primary/40 group relative overflow-hidden rounded-xl border p-3 shadow-lg ring-1 shadow-black/20 ring-white/[0.03] backdrop-blur-sm transition-colors',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="from-primary/10 pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity group-hover:opacity-150"
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-2xl leading-none font-semibold tabular-nums">
          {loading ? <span className="text-muted-foreground/40">—</span> : (value ?? '—')}
        </p>
        <Icon className="text-primary/70 h-4 w-4 shrink-0" />
      </div>
      <p className="text-muted-foreground relative mt-2 text-[11px] leading-tight">{label}</p>
    </Link>
  );
}
