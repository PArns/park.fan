'use client';

import { useState } from 'react';
import { BarChart3, CalendarDays, Flame, Languages } from 'lucide-react';
import { useAdminFetch } from '../_lib/admin-context';
import {
  AdminPage,
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelBody,
  PanelHeader,
  StatTile,
} from '../_ui/primitives';
import { cn } from '@/lib/utils';

type Kind = 'article' | 'news' | 'park' | 'attraction';

/** German first: most of the traffic, and the admin's own language. */
const LOCALES = ['de', 'en', 'nl', 'fr', 'es', 'it'] as const;
type Locale = (typeof LOCALES)[number];
type ByLocale = Partial<Record<Locale, number>>;

const WINDOWS = [7, 30, 90] as const;

const KIND_LABEL: Record<Kind, string> = {
  article: 'Guides',
  news: 'News',
  park: 'Parks',
  attraction: 'Fahrgeschäfte',
};

/** The answer of `GET /v1/admin/page-views`, see the backend's docs/frontend/page-views.md. */
interface PageViewsOverview {
  days: number;
  from: string;
  kinds: {
    kind: Kind;
    total: number;
    byLocale: ByLocale;
    top: {
      key: string;
      total: number;
      byLocale: ByLocale;
      name?: string;
      context?: string;
      url?: string;
    }[];
  }[];
  daily: { day: string; byKind: Partial<Record<Kind, number>> }[];
}

/** A post's German title and page, keyed by `translationKey`. */
export type PostTitles = Record<string, { title: string; path: string }>;

const number = new Intl.NumberFormat('de-DE');

/** The language with the most views, as „DE · 72 %". */
function leadingLocale(byLocale: ByLocale, total: number): string | undefined {
  const [locale, views] =
    (Object.entries(byLocale) as [Locale, number][]).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!locale || !total) return undefined;
  return `${locale.toUpperCase()} · ${Math.round((views / total) * 100)} %`;
}

/**
 * What is read and viewed, and in which language: the totals per kind, the split by language, the
 * views per day and the most viewed pages of each kind with their own split. Counts come from the
 * site's own page-view beacon, not from Umami: bots, Do Not Track and the opt-out are not in them.
 */
export function PopularityView({ postTitles }: { postTitles: PostTitles }) {
  const [days, setDays] = useState<(typeof WINDOWS)[number]>(30);
  const { data, error } = useAdminFetch<PageViewsOverview>(
    `/api/admin/page-views?days=${days}&limit=25`
  );

  const windowSwitch = (
    <div className="border-border/60 flex rounded-lg border p-0.5" role="group">
      {WINDOWS.map((window) => (
        <button
          key={window}
          type="button"
          aria-pressed={days === window}
          onClick={() => setDays(window)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium tabular-nums transition-colors',
            days === window
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {window} Tage
        </button>
      ))}
    </div>
  );

  if (error) return <ErrorState message={`Seitenaufrufe: ${error}`} />;
  if (!data) return <LoadingState label="Lade Seitenaufrufe…" />;

  const total = data.kinds.reduce((sum, kind) => sum + kind.total, 0);
  const dailyMax = Math.max(
    1,
    ...data.daily.map((day) => Object.values(day.byKind).reduce((a, b) => a + (b ?? 0), 0))
  );

  return (
    <AdminPage width="wide">
      <Panel>
        <PanelHeader
          icon={Flame}
          title="Beliebtheit"
          hint={`Gezählte Aufrufe seit ${data.from} (UTC). Ohne Bots, ohne Do Not Track, ohne Opt-out; höchstens drei pro Adresse, Seite und Tag.`}
          action={windowSwitch}
        />
        <PanelBody className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {data.kinds.map((kind) => (
            <StatTile
              key={kind.kind}
              label={KIND_LABEL[kind.kind]}
              value={number.format(kind.total)}
              sub={leadingLocale(kind.byLocale, kind.total) ?? 'noch keine Aufrufe'}
            />
          ))}
        </PanelBody>
      </Panel>

      {total === 0 ? (
        <Panel>
          <EmptyState
            icon={BarChart3}
            title="Noch keine Aufrufe gezählt"
            description="Der Zähler läuft ab dem Deploy des Beacons; die Ranglisten füllen sich mit den ersten Lesern."
          />
        </Panel>
      ) : (
        <>
          <Panel>
            <PanelHeader icon={Languages} title="Nach Sprache" hint="Wo gelesen wird" />
            <PanelBody className="overflow-x-auto">
              <table className="w-full text-sm tabular-nums">
                <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                  <tr>
                    <th className="py-1.5 pr-3 text-left font-medium">Art</th>
                    {LOCALES.map((locale) => (
                      <th key={locale} className="px-2 py-1.5 text-right font-medium">
                        {locale}
                      </th>
                    ))}
                    <th className="py-1.5 pl-3 text-right font-medium">Summe</th>
                  </tr>
                </thead>
                <tbody className="divide-border/40 divide-y">
                  {data.kinds.map((kind) => (
                    <tr key={kind.kind}>
                      <td className="py-2 pr-3 font-medium">{KIND_LABEL[kind.kind]}</td>
                      {LOCALES.map((locale) => (
                        <td key={locale} className="text-muted-foreground px-2 py-2 text-right">
                          {kind.byLocale[locale] ? number.format(kind.byLocale[locale]) : '–'}
                        </td>
                      ))}
                      <td className="py-2 pl-3 text-right font-semibold">
                        {number.format(kind.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader icon={CalendarDays} title="Pro Tag" hint="Alle Arten zusammen, UTC" />
            <PanelBody>
              <div className="flex h-28 items-end gap-1" aria-label="Aufrufe pro Tag">
                {data.daily.map((day) => {
                  const views = Object.values(day.byKind).reduce((a, b) => a + (b ?? 0), 0);
                  return (
                    <div
                      key={day.day}
                      title={`${day.day}: ${number.format(views)} Aufrufe`}
                      className="bg-primary/70 hover:bg-primary min-w-1 flex-1 rounded-t transition-colors"
                      style={{ height: `${Math.max(4, (views / dailyMax) * 100)}%` }}
                    />
                  );
                })}
              </div>
              <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px] tabular-nums">
                <span>{data.daily[0]?.day}</span>
                <span>{data.daily.at(-1)?.day}</span>
              </div>
            </PanelBody>
          </Panel>

          {/* One table per row: six language columns leave a half-width table no room for a title. */}
          <div className="grid gap-5">
            {data.kinds
              .filter((kind) => kind.top.length > 0)
              .map((kind) => (
                <Panel key={kind.kind}>
                  <PanelHeader
                    icon={BarChart3}
                    title={`Meistgesehen: ${KIND_LABEL[kind.kind]}`}
                    hint={`Top ${kind.top.length}, alle Sprachen`}
                  />
                  <PanelBody className="overflow-x-auto p-0">
                    <table className="w-full min-w-[40rem] table-fixed text-sm tabular-nums">
                      <thead className="text-muted-foreground text-[11px] tracking-wide uppercase">
                        <tr className="border-border/50 border-b">
                          <th className="w-10 py-2 pl-4 text-left font-medium">#</th>
                          <th className="py-2 text-left font-medium">Seite</th>
                          {LOCALES.map((locale) => (
                            <th key={locale} className="w-14 px-1.5 py-2 text-right font-medium">
                              {locale}
                            </th>
                          ))}
                          <th className="w-20 py-2 pr-4 pl-2 text-right font-medium">Summe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-border/40 divide-y">
                        {kind.top.map((entry, index) => {
                          const post = postTitles[entry.key];
                          const name = entry.name ?? post?.title ?? entry.key;
                          const href = entry.url ?? post?.path;
                          return (
                            <tr key={entry.key}>
                              <td className="text-muted-foreground py-2 pl-4">{index + 1}</td>
                              <td className="py-2 pr-2">
                                {href ? (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary block truncate font-medium"
                                  >
                                    {name}
                                  </a>
                                ) : (
                                  <span className="block truncate font-medium">{name}</span>
                                )}
                                {entry.context && (
                                  <span className="text-muted-foreground block truncate text-xs">
                                    {entry.context}
                                  </span>
                                )}
                              </td>
                              {LOCALES.map((locale) => (
                                <td
                                  key={locale}
                                  className="text-muted-foreground px-1.5 py-2 text-right"
                                >
                                  {entry.byLocale[locale] ?? '–'}
                                </td>
                              ))}
                              <td className="py-2 pr-4 pl-2 text-right font-semibold">
                                {number.format(entry.total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </PanelBody>
                </Panel>
              ))}
          </div>
        </>
      )}
    </AdminPage>
  );
}
