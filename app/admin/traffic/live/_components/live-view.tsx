'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Activity, ExternalLink, MoonStar, Pencil, Radio, TrendingUp } from 'lucide-react';
import { localeNames, type Locale } from '@/i18n/config';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import {
  breakdownValueLabel,
  countryName,
  DATACENTER_LABEL,
  DATACENTER_SCOPES,
  eventLabel,
  pageTypeLabel,
  parseDatacenterScope,
  parseTrafficLocale,
  pathEditorHref,
  referrerHref,
  type DatacenterScope,
} from '@/lib/admin/site-analytics';
import {
  formatLiveClock,
  isQuiet,
  liveDrillHref,
  liveEventHref,
  referrersEmptyText,
  minuteSeries,
  minuteTotal,
  type LiveMinutePoint,
} from '@/lib/admin/live-traffic';
import type { LiveTraffic } from '@/lib/api/admin-site-analytics';
import type { BarRow } from '../../../_ui/charts';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../../_ui/primitives';
import { RowLink } from '../../_components/breakdown-panel';
import { LanguageSwitch } from '../../_components/language-switch';
import { Segmented } from '../../../_ui/controls';
import { useLiveTraffic } from '../_lib/use-live-traffic';
import { CountUp } from './count-up';
import { LiveList } from './live-list';
import { LiveMap } from './live-map';
import { LiveStatus } from './live-status';
import { MinuteChart } from './minute-chart';
import './live.css';

/** The admin's panels carry a backdrop blur, which every frame of motion inside would re-read. */
const STILL_GLASS = 'backdrop-blur-none';

/** How many countries the list beside the devices shows; the map has all of them. */
const COUNTRY_ROWS = 8;

/** The share of each row in a list that holds every value of its dimension. */
function withShares(rows: BarRow[]): BarRow[] {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  return rows.map((row) => ({ ...row, share: total > 0 ? row.value / total : 0 }));
}

/**
 * `/admin/traffic/live`: who is on park.fan right now, from the counter's per-minute memory. The
 * language is in the address (`?locale=`), and switching it starts the board afresh, so the first
 * answer in a language ripples nothing.
 */
export function LiveView() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = parseTrafficLocale(params.get('locale'));
  const datacenter = parseDatacenterScope(params.get('datacenter'));

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router]
  );

  return (
    <AdminPage width="wide">
      <LiveBoard
        key={`${locale ?? 'all'}|${datacenter}`}
        locale={locale}
        onLocale={(value) => setParam('locale', value)}
        datacenter={datacenter}
        onDatacenter={(value) => setParam('datacenter', value === 'exclude' ? null : value)}
      />
    </AdminPage>
  );
}

function LiveBoard({
  locale,
  onLocale,
  datacenter,
  onDatacenter,
}: {
  locale: Locale | null;
  onLocale: (locale: Locale | null) => void;
  datacenter: DatacenterScope;
  onDatacenter: (datacenter: DatacenterScope) => void;
}) {
  const live = useLiveTraffic(locale, datacenter);
  const animate = !useMediaQuery('(prefers-reduced-motion: reduce)');
  const data = live.data;
  const minutes = useMemo(() => (data ? minuteSeries(data) : []), [data]);

  const languages = (
    <div className="flex flex-wrap gap-2">
      <LanguageSwitch value={locale} onChange={onLocale} />
      <Segmented
        label="Rechenzentren"
        value={datacenter}
        onChange={onDatacenter}
        options={DATACENTER_SCOPES.map((scope) => ({ value: scope, ...DATACENTER_LABEL[scope] }))}
      />
    </div>
  );

  const header = (
    <PanelHeader
      icon={Radio}
      title="Live"
      hint="Die letzten fünf Minuten auf park.fan, alle fünf Sekunden neu, solange der Tab vorne ist."
      action={
        data && (
          <LiveStatus
            ok={!live.isError}
            at={data.at}
            receivedAt={live.dataUpdatedAt}
            animate={animate}
            error={live.error?.message}
          />
        )
      }
    />
  );

  const toolbar = (
    <div className="border-border/50 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
      {languages}
      <Link
        href={liveDrillHref(null, '', locale)}
        className="text-primary flex items-center gap-1 text-xs hover:underline max-sm:min-h-9"
      >
        <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Traffic von heute
      </Link>
    </div>
  );

  if (!data) {
    return (
      <Panel className={STILL_GLASS}>
        {header}
        {toolbar}
        {live.error ? (
          <ErrorState message={`Live: ${live.error.message}`} onRetry={() => void live.refetch()} />
        ) : (
          <LoadingState label="Lade Live-Zahlen…" />
        )}
      </Panel>
    );
  }

  return (
    <>
      <Panel className={`overflow-hidden ${STILL_GLASS}`}>
        {header}
        {toolbar}
        {live.isError && (
          <p className="border-border/50 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-300 transition-opacity duration-300 starting:opacity-0">
            Die letzte Abfrage ist gescheitert ({live.error?.message}). Zu sehen ist der Stand von{' '}
            {formatLiveClock(data.at)}, die nächste Abfrage folgt in fünf Sekunden.
          </p>
        )}
        <LiveHero live={data} minutes={minutes} animate={animate} locale={locale} />
      </Panel>

      {isQuiet(data) ? (
        <Panel className={STILL_GLASS}>
          <EmptyState
            icon={MoonStar}
            title={
              locale ? `Auf ${localeNames[locale]} ist gerade niemand da` : 'Gerade ist niemand da'
            }
            description={
              locale
                ? 'In dieser Sprache kam in den letzten 30 Minuten kein Aufruf und kein Ereignis an. Unter „Alle“ siehst du jede Sprache.'
                : 'In den letzten 30 Minuten kam kein Aufruf und kein Ereignis an. Der nächste Besuch erscheint hier ohne Neuladen. Do Not Track, Global Privacy Control, das Opt-out und Bots zählen nicht.'
            }
            action={
              locale ? (
                <button
                  type="button"
                  onClick={() => onLocale(null)}
                  className="text-primary text-xs underline underline-offset-2"
                >
                  Alle Sprachen zeigen
                </button>
              ) : (
                <Link
                  href={liveDrillHref(null, '', null)}
                  className="text-primary text-xs underline underline-offset-2"
                >
                  Traffic von heute öffnen
                </Link>
              )
            }
          />
        </Panel>
      ) : (
        <LiveDetails live={data} minutes={minutes} animate={animate} locale={locale} />
      )}
    </>
  );
}

/** The big count, three figures under it and the map, the part of the page read from across a room. */
function LiveHero({
  live,
  minutes,
  animate,
  locale,
}: {
  live: LiveTraffic;
  minutes: readonly LiveMinutePoint[];
  animate: boolean;
  locale: Locale | null;
}) {
  const figures = [
    { label: 'Aufrufe', window: 'letzte 30 Min.', value: minuteTotal(minutes, 'pageviews') },
    { label: 'Ereignisse', window: 'letzte 30 Min.', value: minuteTotal(minutes, 'events') },
    { label: 'Länder', window: 'letzte 5 Min.', value: live.countries.length },
  ];

  return (
    <PanelBody className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-center lg:gap-8 lg:py-6 [&>*]:min-w-0">
      <div className="relative">
        {animate && live.activeVisitors > 0 && (
          <span
            key={live.activeVisitors}
            aria-hidden="true"
            className="live-halo pointer-events-none absolute top-1/2 left-16 h-48 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-primary)_45%,transparent),transparent)] blur-xl"
          />
        )}
        <div className="relative">
          <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
            Aktiv jetzt
          </p>
          <p className="mt-1 text-7xl leading-none font-bold tracking-tight tabular-nums sm:text-8xl">
            <CountUp
              value={live.activeVisitors}
              animate={animate}
              className="bg-gradient-to-b from-white to-sky-200/80 bg-clip-text text-transparent"
            />
          </p>
          <p className="text-muted-foreground mt-2 text-sm">Besucher in den letzten 5 Minuten</p>
          <dl className="border-border/50 mt-6 grid grid-cols-3 gap-3 border-t pt-4">
            {figures.map((figure) => (
              <div key={figure.label} className="min-w-0">
                <dt className="text-muted-foreground truncate text-[11px] tracking-wide uppercase">
                  {figure.label}
                </dt>
                <dd className="mt-0.5 text-xl font-semibold tabular-nums">
                  <CountUp value={figure.value} animate={animate} duration={700} />
                </dd>
                <dd className="text-muted-foreground/80 text-[11px]">{figure.window}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <LiveMap countries={live.countries} animate={animate} locale={locale} />
    </PanelBody>
  );
}

/** The chart and the lists under the hero. */
function LiveDetails({
  live,
  minutes,
  animate,
  locale,
}: {
  live: LiveTraffic;
  minutes: readonly LiveMinutePoint[];
  animate: boolean;
  locale: Locale | null;
}) {
  const pages: BarRow[] = live.pages.map((page) => {
    const editor = pathEditorHref(page.path);
    return {
      key: page.path,
      label: page.path,
      startTruncate: true,
      value: page.views,
      href: liveDrillHref('path', page.path, locale),
      detail: pageTypeLabel(page.pageType),
      actions: (
        <>
          <RowLink href={page.path} label="Auf park.fan öffnen" external>
            <ExternalLink className="h-3 w-3" />
          </RowLink>
          {editor && (
            <RowLink href={editor} label="Im Editor öffnen">
              <Pencil className="h-3 w-3" />
            </RowLink>
          )}
        </>
      ),
    };
  });

  const events: BarRow[] = live.events.map((event) => {
    const label = eventLabel(event.name);
    return {
      key: event.name,
      label,
      detail: label === event.name ? undefined : event.name,
      value: event.count,
      href: liveEventHref(event.name, locale),
    };
  });

  const channels = withShares(
    live.channels.map((channel) => ({
      key: channel.channel,
      label: breakdownValueLabel('channel', channel.channel),
      value: channel.visits,
      href: liveDrillHref('channel', channel.channel, locale),
    }))
  );

  const referrers: BarRow[] = live.referrers.map((referrer) => {
    const site = referrerHref(referrer.referrer);
    return {
      key: referrer.referrer,
      label: referrer.referrer,
      value: referrer.visits,
      href: liveDrillHref('referrer', referrer.referrer, locale),
      actions: site && (
        <RowLink href={site} label="Website öffnen" external>
          <ExternalLink className="h-3 w-3" />
        </RowLink>
      ),
    };
  });

  const countries = withShares(
    live.countries.map((country) => ({
      key: country.country,
      label: countryName(country.country),
      value: country.views,
      href: liveDrillHref('country', country.country.toLowerCase(), locale),
    }))
  ).slice(0, COUNTRY_ROWS);

  const devices = withShares(
    live.devices.map((device) => ({
      key: device.device,
      label: breakdownValueLabel('device', device.device),
      value: device.views,
      href: liveDrillHref('device', device.device, locale),
    }))
  );

  return (
    <>
      <Panel className={STILL_GLASS}>
        <PanelHeader
          icon={Activity}
          title="Letzte 30 Minuten"
          hint="Aufrufe und Ereignisse je Minute, Besucher als Linie; die Säule rechts ist die laufende Minute. Uhrzeit dieses Rechners."
        />
        <PanelBody>
          <MinuteChart minutes={minutes} animate={animate} />
        </PanelBody>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <ListPanel
          title="Seiten"
          hint="Die zehn meistgesehenen der letzten 5 Minuten"
          unit="Aufrufe"
        >
          <LiveList
            rows={pages}
            unit="Aufrufe"
            animate={animate}
            empty="Keine Aufrufe in den letzten 5 Minuten"
          />
        </ListPanel>
        <ListPanel
          title="Ereignisse"
          hint="Letzte 30 Minuten; eine Zeile öffnet das Ereignis für heute"
          unit="Anzahl"
        >
          <LiveList
            rows={events}
            unit="Ereignisse"
            animate={animate}
            limit={10}
            empty="Keine Ereignisse in den letzten 30 Minuten"
          />
        </ListPanel>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        <ListPanel title="Kanäle" hint="Besuchsbeginn, letzte 30 Min." unit="Besuche">
          <LiveList rows={channels} unit="Besuche" animate={animate} empty="Kein Besuch begann" />
        </ListPanel>
        <ListPanel title="Herkunft" hint="Website oder Quelle, 30 Min." unit="Besuche">
          <LiveList
            rows={referrers}
            unit="Besuche"
            animate={animate}
            empty={referrersEmptyText(
              live.channels.reduce((sum, channel) => sum + channel.visits, 0)
            )}
          />
        </ListPanel>
        <ListPanel title="Länder" hint="Letzte 5 Min., alle auf der Karte" unit="Aufrufe">
          <LiveList
            rows={countries}
            unit="Aufrufe"
            animate={animate}
            empty="Keine Aufrufe in den letzten 5 Minuten"
          />
        </ListPanel>
        <ListPanel title="Geräte" hint="Aus dem User-Agent, letzte 5 Min." unit="Aufrufe">
          <LiveList
            rows={devices}
            unit="Aufrufe"
            animate={animate}
            empty="Keine Aufrufe in den letzten 5 Minuten"
          />
        </ListPanel>
      </div>
    </>
  );
}

/** A panel around one live list, with what the counts count on the right. */
function ListPanel({
  title,
  hint,
  unit,
  children,
}: {
  title: string;
  hint: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className={STILL_GLASS}>
      <PanelHeader
        title={title}
        hint={hint}
        action={<span className="text-muted-foreground text-[11px]">{unit}</span>}
      />
      <PanelBody>{children}</PanelBody>
    </Panel>
  );
}
