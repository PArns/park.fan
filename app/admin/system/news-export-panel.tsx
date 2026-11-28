'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Newspaper,
  Play,
  RefreshCw,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { locales } from '@/i18n/config';
import { durationLabel, minutesAgoLabel } from '@/lib/admin/health';
import {
  EXPORT_BEHIND_MINUTES,
  exportIsLate,
  exportNeedsRun,
  exportVerdict,
  type ExportFeedStatus,
  type ExportPostRef,
  type NewsExportReport,
  type NewsExportRunAnswer,
} from '@/lib/admin/news-export-lag';
import type { ExportFeed } from '@/lib/blog/news-export-feeds';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { cn } from '@/lib/utils';
import { useCan } from '../_app/session';
import { AdminApiError, adminFetch, useAdminQuery } from '../_lib/api';
import { formatDayTime } from '../_lib/format';
import { HEALTH_FILL, HEALTH_TEXT } from '../_ui/metrics';
import {
  ErrorState,
  LoadingState,
  Meta,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
  Tile,
} from '../_ui/primitives';

const FEED_META: Record<ExportFeed, { label: string; icon: LucideIcon }> = {
  news: { label: 'News', icon: Newspaper },
  guides: { label: 'Guides', icon: BookOpen },
};

/** Under `admin`, so the topbar's refresh reads the export again. */
const EXPORT_KEY = ['admin', 'news-export'] as const;

/** Missing posts a tile names before it only counts the rest. */
const MISSING_SHOWN = 3;

/** How long a run takes, in the words the panel uses. */
const RUN_DURATION = 'etwa 20 Minuten';

/**
 * When the panel reads the export again after starting a run: the run's length and the five
 * minutes the route keeps a list it read. Once, not a poll.
 */
const RECHECK_AFTER_MS = 25 * 60_000;

/** The restart from the panel: not asked, on its way to GitHub, started, or refused with why. */
type RunState =
  | { state: 'idle' }
  | { state: 'starting' }
  | { state: 'started'; workflowUrl: string }
  | { state: 'failed'; reason: string };

/** The German sentence of a refused start, which the routes send as `reason`, else the error's. */
function refusalReason(error: unknown): string {
  if (error instanceof AdminApiError) {
    const reason = (error.payload as { reason?: unknown } | null)?.reason;
    if (typeof reason === 'string') return reason;
  }
  return error instanceof Error ? error.message : 'unbekannter Fehler';
}

/**
 * The native app's export on media.park.fan against the site, per feed: when it last ran, its
 * newest post and the site's, and what it lacks. When a feed is late or a list cannot be read, it
 * asks whether to start a new run; an editor starts it here, everybody else on the workflow page.
 */
export function NewsExportPanel() {
  const query = useAdminQuery<NewsExportReport>(EXPORT_KEY, '/api/admin/news-export', {
    staleTime: 60_000,
  });
  const now = useMinuteNow();
  const report = query.data;
  const canRun = useCan('editor');
  const [run, setRun] = useState<RunState>({ state: 'idle' });
  const { refetch } = query;

  useEffect(() => {
    if (run.state !== 'started') return;
    const timer = setTimeout(() => {
      setRun({ state: 'idle' });
      void refetch();
    }, RECHECK_AFTER_MS);
    return () => clearTimeout(timer);
  }, [run.state, refetch]);

  async function startRun() {
    setRun({ state: 'starting' });
    try {
      const answer = await adminFetch<NewsExportRunAnswer>('/api/admin/news-export/run', {
        method: 'POST',
      });
      setRun(
        answer.started
          ? { state: 'started', workflowUrl: answer.workflowUrl }
          : { state: 'failed', reason: answer.reason }
      );
    } catch (error) {
      setRun({ state: 'failed', reason: refusalReason(error) });
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={Smartphone}
        title="Export für die App"
        hint="Was die App von media.park.fan liest und wonach die API Mitteilungen schickt"
      />
      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : !report ? (
        <LoadingState label="Export wird gelesen…" />
      ) : (
        <PanelBody className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.feeds.map((status) => (
              <FeedTile key={status.feed} status={status} now={now} />
            ))}
          </div>
          {run.state === 'started' ? (
            <RunStarted
              workflowUrl={run.workflowUrl}
              reloading={query.isFetching}
              onReload={() => void query.refetch()}
            />
          ) : exportNeedsRun(report.feeds) ? (
            <Notice>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">Export neu starten?</p>
                  <p className="mt-0.5 text-[13px] text-amber-100/80">
                    Ein Lauf schreibt News und Guides in allen Sprachen neu und dauert{' '}
                    {RUN_DURATION}.{!canRun && ' Gestartet wird er auf GitHub mit „Run workflow“.'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 max-sm:w-full">
                  {canRun && (
                    <RestartButton
                      starting={run.state === 'starting'}
                      onStart={() => void startRun()}
                    />
                  )}
                  <Button asChild size="sm" variant="outline" className="max-sm:flex-1">
                    <a href={report.workflowUrl} target="_blank" rel="noopener noreferrer">
                      {canRun ? 'Auf GitHub' : 'Auf GitHub starten'}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </Button>
                </div>
              </div>
              {run.state === 'failed' && <RunRefused reason={run.reason} />}
            </Notice>
          ) : (
            canRun && (
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <RestartButton
                    variant="outline"
                    starting={run.state === 'starting'}
                    onStart={() => void startRun()}
                  />
                  <p className="text-muted-foreground text-xs">
                    Nötig erst, wenn ein Feed gelb oder rot ist. Ein Lauf dauert {RUN_DURATION}.
                  </p>
                </div>
                {run.state === 'failed' && <RunRefused reason={run.reason} />}
              </div>
            )
          )}
          <p className="text-muted-foreground text-[11px] tabular-nums">
            Stand {formatDayTime(report.checkedAt)} · Deploy vom {formatDayTime(report.deployedAt)}{' '}
            · die Listen werden höchstens alle fünf Minuten neu gelesen
          </p>
        </PanelBody>
      )}
    </Panel>
  );
}

/** „Export neu starten“, disabled with a spinner while the request is on its way. */
function RestartButton({
  starting,
  onStart,
  variant = 'default',
}: {
  starting: boolean;
  onStart: () => void;
  variant?: 'default' | 'outline';
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      onClick={onStart}
      disabled={starting}
      className="max-sm:flex-1"
    >
      {starting ? <Loader2 className="animate-spin" /> : <Play />}
      Export neu starten
    </Button>
  );
}

/** Why the start was refused, as the route said it. */
function RunRefused({ reason }: { reason: string }) {
  return (
    <p role="alert" className="mt-2 text-xs text-red-300">
      Nicht gestartet: {reason}
    </p>
  );
}

/** After a start: how long the run takes, where it shows up, and the way to read the export again. */
function RunStarted({
  workflowUrl,
  reloading,
  onReload,
}: {
  workflowUrl: string;
  reloading: boolean;
  onReload: () => void;
}) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-3.5 py-3 text-sm text-emerald-200"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">Export gestartet</p>
          <p className="mt-0.5 text-[13px] text-emerald-100/80">
            Ein Lauf dauert {RUN_DURATION}. In {RECHECK_AFTER_MS / 60_000} Minuten liest dieser
            Bereich den Export von selbst neu.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 max-sm:w-full">
          <Button asChild size="sm" variant="outline" className="max-sm:flex-1">
            <a href={workflowUrl} target="_blank" rel="noopener noreferrer">
              Auf GitHub ansehen
              <ExternalLink aria-hidden="true" />
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReload}
            disabled={reloading}
            className="max-sm:flex-1"
          >
            <RefreshCw className={cn(reloading && 'animate-spin')} />
            Neu lesen
          </Button>
        </div>
      </div>
    </div>
  );
}

/** One feed: its verdict, when the export ran, the two newest posts and what is missing. */
function FeedTile({ status, now }: { status: ExportFeedStatus; now: number | null }) {
  const meta = FEED_META[status.feed];
  const ran = status.generatedAt ? Date.parse(status.generatedAt) : Number.NaN;
  const late = exportIsLate(status);
  const rest = status.missing.length - MISSING_SHOWN;

  return (
    <Tile
      icon={meta.icon}
      title={meta.label}
      className="space-y-3"
      action={
        <span className="flex min-w-0 items-center gap-1.5 text-xs">
          <span
            aria-hidden="true"
            className={cn('h-2 w-2 shrink-0 rounded-full', HEALTH_FILL[status.tone])}
          />
          <span className={cn('truncate', HEALTH_TEXT[status.tone])}>{exportVerdict(status)}</span>
        </span>
      }
    >
      <div>
        <span className="text-[1.75rem] leading-tight font-semibold tracking-tight tabular-nums">
          {now !== null && Number.isFinite(ran) ? minutesAgoLabel((now - ran) / 60_000) : '—'}
        </span>
        <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
          Export zuletzt · {formatDayTime(status.generatedAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <PostMeta label="Neueste im Export" post={status.newestExported} />
        <PostMeta label="Neueste auf der Webseite" post={status.newestOnSite} />
        {status.behindMinutes !== null && (
          <Meta
            label="Rückstand"
            value={durationLabel(status.behindMinutes)}
            valueClassName={HEALTH_TEXT[status.tone]}
          />
        )}
      </div>

      {status.missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-xs">
            {late ? 'Fehlt im Export' : 'Noch nicht im Export'}
          </p>
          <ul className="space-y-1.5">
            {status.missing.slice(0, MISSING_SHOWN).map((post) => (
              <li key={post.translationKey} className="min-w-0">
                <p className="truncate text-sm">{post.title}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatDayTime(post.publishedAt)} ·{' '}
                  {post.locales.length === locales.length
                    ? 'alle Sprachen'
                    : post.locales.join(', ')}
                </p>
              </li>
            ))}
          </ul>
          {rest > 0 && <p className="text-muted-foreground text-xs">und {rest} weitere</p>}
          {!late && (
            <p className="text-muted-foreground text-xs">
              Ein Lauf dauert {RUN_DURATION}. Nach {durationLabel(EXPORT_BEHIND_MINUTES.warn)}{' '}
              Rückstand wird das hier gelb.
            </p>
          )}
        </div>
      )}

      {status.unreadable.length > 0 && (
        <p className="text-xs text-red-400">
          Nicht lesbar:{' '}
          {status.unreadable.map(({ locale, message }) => `${locale} (${message})`).join(', ')}
        </p>
      )}
    </Tile>
  );
}

/** A post's title over its date, or a dash when there is none. */
function PostMeta({ label, post }: { label: string; post: ExportPostRef | null }) {
  return (
    <Meta
      label={label}
      value={
        post ? (
          <>
            <span className="block truncate font-normal">{post.title}</span>
            <span className="text-muted-foreground block text-xs">
              {formatDayTime(post.publishedAt)}
            </span>
          </>
        ) : (
          '—'
        )
      }
    />
  );
}
