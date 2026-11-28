'use client';

import { BookOpen, ExternalLink, Newspaper, Smartphone, type LucideIcon } from 'lucide-react';
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
} from '@/lib/admin/news-export-lag';
import type { ExportFeed } from '@/lib/blog/news-export-feeds';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { cn } from '@/lib/utils';
import { useAdminQuery } from '../_lib/api';
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

/**
 * The native app's export on media.park.fan against the site, per feed: when it last ran, its
 * newest post and the site's, and what it lacks. When a feed is late or a list cannot be read, it
 * asks whether to start a new run and links the workflow page where that is done.
 */
export function NewsExportPanel() {
  const query = useAdminQuery<NewsExportReport>(EXPORT_KEY, '/api/admin/news-export', {
    staleTime: 60_000,
  });
  const now = useMinuteNow();
  const report = query.data;

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
          {exportNeedsRun(report.feeds) && (
            <Notice>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">Export neu starten?</p>
                  <p className="mt-0.5 text-[13px] text-amber-100/80">
                    Ein Lauf schreibt News und Guides in allen Sprachen neu und dauert etwa eine
                    halbe Stunde. Gestartet wird er auf GitHub mit „Run workflow“.
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="max-sm:w-full">
                  <a href={report.workflowUrl} target="_blank" rel="noopener noreferrer">
                    Auf GitHub starten
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </Notice>
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
              Ein Lauf dauert etwa eine halbe Stunde. Nach{' '}
              {durationLabel(EXPORT_BEHIND_MINUTES.warn)} Rückstand wird das hier gelb.
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
