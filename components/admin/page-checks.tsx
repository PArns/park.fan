'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Braces,
  ExternalLink,
  FileSearch,
  Globe,
  ImageOff,
  Link as LinkIcon,
  Loader2,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import { adminFetch } from '@/app/admin/_lib/api';
import { formatAgo } from '@/app/admin/_lib/format';
import { Chip } from '@/app/admin/_ui/primitives';
import {
  REINDEX_STATE_CHIP,
  reindexReason,
  requestReindex,
  type ReindexOutcome,
} from '@/app/admin/traffic/_lib/reindex';
import { HAIRLINE_FILL } from '@/components/common/glass-card';
import {
  SEARCH_CONSOLE_REINDEX_PATH,
  SEARCH_CONSOLE_STATUS_PATH,
  SNIPPET_LIMITS,
} from '@/lib/admin/search-console';
import { formatCount } from '@/lib/admin/site-analytics';
import type {
  SearchConsoleReindexQueue,
  SearchConsoleStatus,
} from '@/lib/api/admin-search-console';
import { cn } from '@/lib/utils';

/** What the page on screen says about itself in its `<head>` and markup, read from the DOM. */
export interface PageDocument {
  title: string;
  description: string | null;
  canonical: string | null;
  /** Whether the canonical names this page's path. */
  canonicalIsSelf: boolean;
  noindex: boolean;
  hreflangs: number;
  jsonLdTypes: string[];
  /** Images with no `alt` attribute at all; an empty `alt` marks a decorative one and is fine. */
  imagesWithoutAlt: number;
}

/** Every `@type` in a JSON-LD value, nested ones and those of a `@graph` included. */
function typesOf(value: unknown, into: Set<string>) {
  if (Array.isArray(value)) {
    value.forEach((entry) => typesOf(entry, into));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === '@type') [entry].flat().forEach((type) => into.add(String(type)));
    else typesOf(entry, into);
  }
}

/** The page's own head and markup, as a crawler gets them once the page has rendered. */
export function readPageDocument(): PageDocument {
  const canonical =
    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.getAttribute('href') ?? null;
  const robots = [...document.querySelectorAll('meta[name="robots"], meta[name="googlebot"]')]
    .map((meta) => meta.getAttribute('content') ?? '')
    .join(',');
  const types = new Set<string>();
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      typesOf(JSON.parse(script.textContent ?? ''), types);
    } catch {
      types.add('ungültiges JSON');
    }
  }
  return {
    title: document.title,
    description:
      document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    canonical,
    canonicalIsSelf:
      canonical !== null && new URL(canonical, location.href).pathname === location.pathname,
    noindex: /noindex/i.test(robots),
    hreflangs: document.querySelectorAll('link[rel="alternate"][hreflang]').length,
    jsonLdTypes: [...types].sort(),
    imagesWithoutAlt: document.querySelectorAll('img:not([alt])').length,
  };
}

/** The title's width in Google's result font, 20px Arial. */
function titlePixels(title: string): number {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return 0;
  context.font = '20px Arial';
  return Math.round(context.measureText(title).width);
}

/** A section's heading line: an icon, a name and what the figures are measured against. */
export function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold">
      <Icon className="text-primary h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </h3>
  );
}

/** One line of the snippet: its text, its length and whether Google cuts it. */
function SnippetLine({
  label,
  text,
  length,
  cut,
}: {
  label: string;
  text: string | null;
  length: string;
  cut: boolean;
}) {
  return (
    <div className={cn('space-y-1 rounded-lg px-2 py-1.5', HAIRLINE_FILL)}>
      <p className="text-muted-foreground flex items-center justify-between gap-2 text-[10px] uppercase">
        {label}
        <Chip tone={text === null ? 'danger' : cut ? 'warning' : 'muted'}>
          {text === null ? 'fehlt' : cut ? `${length}, wird gekürzt` : length}
        </Chip>
      </p>
      {text !== null && <p className="break-words">{text}</p>}
    </div>
  );
}

/** The page's title and description as Google takes them, with where Google cuts them. */
export function SnippetCheck({ page }: { page: PageDocument }) {
  const pixels = titlePixels(page.title);
  const titleCut =
    page.title.length > SNIPPET_LIMITS.titleChars || pixels > SNIPPET_LIMITS.titlePixels;
  const descriptionCut = (page.description?.length ?? 0) > SNIPPET_LIMITS.descriptionChars;
  return (
    <div className="space-y-1.5">
      <SnippetLine
        label="Titel"
        text={page.title || null}
        length={`${page.title.length} Zeichen, ${pixels} px`}
        cut={titleCut}
      />
      <SnippetLine
        label="Beschreibung"
        text={page.description}
        length={`${page.description?.length ?? 0} Zeichen`}
        cut={descriptionCut}
      />
    </div>
  );
}

/** One finding of the technical check, with a warning tone where it needs a look. */
function Check({
  icon: Icon,
  label,
  warn,
  children,
}: {
  icon: LucideIcon;
  label: string;
  warn: boolean;
  children: ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn(
          'mt-0.5 h-3 w-3 shrink-0',
          warn ? 'text-destructive' : 'text-muted-foreground'
        )}
        aria-hidden="true"
      />
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className={cn('min-w-0 flex-1 break-words', warn && 'text-destructive')}>
        {children}
      </span>
    </li>
  );
}

/** Canonical, robots, hreflang, structured data and alt texts, all read from the page itself. */
export function TechnicalCheck({ page }: { page: PageDocument }) {
  return (
    <ul className="space-y-1">
      <Check icon={LinkIcon} label="Canonical" warn={!page.canonicalIsSelf}>
        {page.canonical === null
          ? 'fehlt'
          : page.canonicalIsSelf
            ? 'zeigt auf diese Seite'
            : `zeigt woanders hin: ${page.canonical}`}
      </Check>
      <Check icon={ShieldAlert} label="Robots" warn={page.noindex}>
        {page.noindex ? 'noindex, Google nimmt die Seite nicht auf' : 'indexierbar'}
      </Check>
      <Check icon={Globe} label="hreflang" warn={page.hreflangs === 0}>
        {page.hreflangs === 0 ? 'keine' : `${page.hreflangs} Sprachfassungen verlinkt`}
      </Check>
      <Check icon={Braces} label="JSON-LD" warn={page.jsonLdTypes.length === 0}>
        {page.jsonLdTypes.length === 0 ? 'keine' : page.jsonLdTypes.join(', ')}
      </Check>
      <Check icon={ImageOff} label="Alt-Texte" warn={page.imagesWithoutAlt > 0}>
        {page.imagesWithoutAlt === 0
          ? 'jedes Bild hat einen'
          : `${formatCount(page.imagesWithoutAlt)} Bilder ohne alt-Attribut`}
      </Check>
    </ul>
  );
}

const OUTCOME_TONE = { success: 'success', error: 'danger', info: 'muted' } as const;

type IndexState =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'ready'; siteUrl: string | null; queue: SearchConsoleReindexQueue };

/**
 * Whether Google has crawled the page since it last changed, from the reindex queue, and the same
 * „Beantragen“ as the queue's panel for a page that waits for it. Read when mounted, so only with
 * the overlay open.
 */
export function IndexStatus({ path }: { path: string }) {
  const [state, setState] = useState<IndexState>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<ReindexOutcome | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    Promise.all([
      adminFetch<SearchConsoleStatus>(SEARCH_CONSOLE_STATUS_PATH, { signal }),
      adminFetch<SearchConsoleReindexQueue>(SEARCH_CONSOLE_REINDEX_PATH, { signal }),
    ])
      .then(([status, queue]) => setState({ status: 'ready', siteUrl: status.siteUrl, queue }))
      .catch(() => {
        if (!signal.aborted) setState({ status: 'failed' });
      });
    return () => controller.abort();
  }, [path, round]);

  if (state.status === 'loading') return <p className="text-muted-foreground">Lädt …</p>;
  if (state.status === 'failed') {
    return <p className="text-muted-foreground">Die Liste zum Nachindizieren antwortet nicht.</p>;
  }

  const { queue, siteUrl } = state;
  const open = queue.open.find((item) => item.path === path);
  const requested = queue.requested.find((item) => item.path === path);
  const atLimit = queue.requestsLast24h >= queue.dailyLimit;

  async function request() {
    if (!open || !siteUrl) return;
    setBusy(true);
    setOutcome(await requestReindex(siteUrl, open));
    setBusy(false);
    setRound((value) => value + 1);
  }

  return (
    <div className="space-y-1.5">
      {open ? (
        <>
          <p className="flex flex-wrap items-center gap-1.5">
            <Chip tone={REINDEX_STATE_CHIP[open.state].tone}>
              {REINDEX_STATE_CHIP[open.state].label}
            </Chip>
            {reindexReason(open)}
          </p>
          {siteUrl && (
            <button
              type="button"
              onClick={() => void request()}
              disabled={busy}
              title="Kopiert die URL, öffnet die Search Console und merkt sich den Antrag"
              className="text-primary inline-flex items-center gap-1 font-medium underline underline-offset-2 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              ) : (
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              )}
              Beantragen
            </button>
          )}
          {atLimit && (
            <p className="text-destructive">
              Schon {queue.requestsLast24h} Anträge in 24 Stunden. Google nimmt etwa{' '}
              {queue.dailyLimit} am Tag an, weitere werden meist abgelehnt.
            </p>
          )}
        </>
      ) : requested ? (
        <p>
          Beantragt {formatAgo(requested.requestedAt!)}
          {requested.requestedBy ? ` von ${requested.requestedBy}` : ''}. {reindexReason(requested)}
        </p>
      ) : (
        <p className="flex items-center gap-1.5">
          <FileSearch className="text-muted-foreground h-3 w-3 shrink-0" aria-hidden="true" />
          Keine Änderung wartet auf Google.
        </p>
      )}
      {outcome && (
        <p role="status" className="flex flex-wrap items-center gap-1.5">
          <Chip tone={OUTCOME_TONE[outcome.tone]}>{outcome.title}</Chip>
          {outcome.description}
        </p>
      )}
    </div>
  );
}
