'use client';

import { Suspense, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Ban, Eye, Loader2, ShieldCheck, TimerOff, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  consentRequestPath,
  describeRedirectHost,
  describeRequestAge,
  describeScopes,
  displayClientName,
  hasPassed,
  safeRedirectTarget,
  type OAuthConsentRequest,
  type OAuthDecision,
} from '@/lib/admin/mcp';
import { ROLE_LABELS } from '@/lib/admin/roles';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { AdminApiError, adminFetch, useAdminQuery } from '../../_lib/api';
import { formatDisplayName } from '../../_lib/format';
import { cn } from '@/lib/utils';
import { SYSTEM_MONO } from '../../_ui/code-block';
import { Chip, EmptyState, LoadingState, Notice, Panel, PanelBody } from '../../_ui/primitives';
import { useSession } from '../../_app/session';

/**
 * Where an app that wants to read the admin asks, after the API sent the browser here with the
 * pending request's id. The redirect host is the one thing on the page that cannot be faked by the
 * app, so it is the largest. See docs/features/admin.md#the-mcp-consent-page.
 */

const subscribeToNothing = () => () => {};

function readFramed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

/**
 * Whether this page sits inside another page's frame. The headers forbid it already
 * (`X-Frame-Options: DENY`), so this is the second line: a consent page the person cannot see
 * the address bar of is one they can be talked into approving.
 */
function useIsFramed(): boolean {
  return useSyncExternalStore(subscribeToNothing, readFramed, () => false);
}

type Phase = 'idle' | 'approve' | 'deny' | 'redirecting';

function ConsentCard({ children }: { children: ReactNode }) {
  return (
    <Panel>
      <PanelBody className="space-y-5 p-5 sm:p-6">{children}</PanelBody>
    </Panel>
  );
}

function SignedInAs({ gone = false }: { gone?: boolean }) {
  const { identity, signOut } = useSession();
  return (
    <p className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-xs">
      <span>
        {gone ? 'Angemeldet' : 'Du bist angemeldet'} als{' '}
        <span className="text-foreground font-medium">{identity.email}</span>.
      </span>
      <button
        type="button"
        // The request survives the sign-out for its ten minutes, so the next account lands on it.
        onClick={() => void signOut(window.location.pathname + window.location.search)}
        className="text-primary underline underline-offset-2 max-sm:py-2"
      >
        Nicht du? Abmelden
      </button>
    </p>
  );
}

function Gone({ message }: { message?: string }) {
  return (
    <ConsentCard>
      <EmptyState
        icon={TimerOff}
        title="Diese Anfrage gibt es nicht mehr"
        description={
          message ??
          'Anfragen gelten zehn Minuten und lassen sich einmal beantworten. Starte die Verbindung in der App noch einmal.'
        }
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/admin">Zum Admin</Link>
          </Button>
        }
      />
      <SignedInAs gone />
    </ConsentCard>
  );
}

function Consent() {
  const params = useSearchParams();
  const { identity, refresh } = useSession();
  const framed = useIsFramed();
  const now = useMinuteNow();
  const requestId = params.get('request');
  const path = framed ? null : consentRequestPath(requestId);

  const query = useAdminQuery<OAuthConsentRequest>(['admin', 'oauth-request', requestId], path, {
    retry: false,
    // A decision consumes the request: refetching on focus or mount would read the answer to it
    // as "gone" while the browser is already on its way to the app.
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: 0,
  });

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [gone, setGone] = useState(false);
  const [target, setTarget] = useState<string | null>(null);
  // A second click can arrive before the first one's re-render disables the buttons.
  const deciding = useRef(false);

  const unauthorized = query.error instanceof AdminApiError && query.error.isUnauthorized;
  useEffect(() => {
    // The session ended under the page; asking the session query again shows the login screen.
    if (unauthorized) refresh();
  }, [unauthorized, refresh]);

  if (framed) {
    return (
      <ConsentCard>
        <EmptyState
          icon={ShieldCheck}
          title="Diese Seite läuft nicht in einem Rahmen"
          description="Eine Freigabe gilt nur, wenn du die Adresse im Browser selbst siehst. Öffne die Seite in einem eigenen Fenster."
          action={
            <Button asChild size="sm" variant="outline">
              <a href={window.location.href} target="_blank" rel="noopener noreferrer">
                Im eigenen Fenster öffnen
              </a>
            </Button>
          }
        />
      </ConsentCard>
    );
  }

  if (path === null) {
    return (
      <Gone message="In der Adresse fehlt die Anfrage. Öffne den Link noch einmal aus der App, die den Zugriff will." />
    );
  }
  if (query.isLoading || unauthorized) {
    return (
      <ConsentCard>
        <LoadingState label="Anfrage wird geladen…" />
      </ConsentCard>
    );
  }
  if (query.error?.status === 404 || gone) return <Gone />;
  if (query.isError || !query.data) {
    return (
      <ConsentCard>
        <EmptyState
          icon={TriangleAlert}
          title="Die Anfrage lässt sich nicht laden"
          description={query.error?.message}
          action={
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              Erneut versuchen
            </Button>
          }
        />
        <SignedInAs gone />
      </ConsentCard>
    );
  }

  const request = query.data;
  if (now !== null && hasPassed(request.expiresAt, now)) return <Gone />;

  const clientName = displayClientName(request.clientName);
  const host = describeRedirectHost(request.redirectHost);
  const scopes = describeScopes(request.scope);
  const minutesLeft =
    now === null ? null : Math.max(1, Math.ceil((Date.parse(request.expiresAt) - now) / 60_000));
  // The clock ticks once a minute and may have been read before the request arrived.
  const age =
    now === null ? null : describeRequestAge(request.createdAt, Math.max(now, query.dataUpdatedAt));
  const busy = phase !== 'idle';

  async function decide(decision: 'approve' | 'deny') {
    if (deciding.current || path === null) return;
    deciding.current = true;
    setPhase(decision);
    setError(null);
    try {
      const result = await adminFetch<OAuthDecision>(`${path}/${decision}`, { method: 'POST' });
      const next = safeRedirectTarget(result?.redirectTo, request.redirectHost);
      if (!next) {
        throw new Error(
          'Die Antwort verweist auf eine andere Adresse als die oben genannte. Du wurdest nicht weitergeleitet.'
        );
      }
      setTarget(next);
      setPhase('redirecting');
      window.location.assign(next);
    } catch (err) {
      deciding.current = false;
      setPhase('idle');
      if (err instanceof AdminApiError && err.status === 404) {
        setGone(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Die Antwort ist fehlgeschlagen.');
    }
  }

  return (
    <ConsentCard>
      <header className="space-y-1">
        <h1 className="text-xl leading-tight font-bold">Darf diese App den Admin lesen?</h1>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-semibold">{clientName}</span> bittet um Zugriff. Der
          Name stammt von der App selbst und ist nicht geprüft.
        </p>
      </header>

      <section
        aria-labelledby="consent-host"
        className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/[0.07] p-4"
      >
        <p
          id="consent-host"
          className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-300 uppercase"
        >
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
          Nach deiner Antwort geht es weiter zu
        </p>
        <p
          data-consent-host=""
          className={cn('text-2xl leading-tight font-semibold break-all sm:text-3xl', SYSTEM_MONO)}
        >
          {request.redirectHost}
        </p>
        {(host.local || host.punycode) && (
          <div className="flex flex-wrap gap-1.5">
            {host.local && <Chip tone="muted">Programm auf diesem Rechner</Chip>}
            {host.punycode && <Chip tone="danger">Punycode-Adresse (xn--)</Chip>}
          </div>
        )}
        <p className="text-muted-foreground text-xs leading-relaxed">
          {host.local
            ? 'localhost ist dieser Rechner. So verbindet sich zum Beispiel Claude Code. Läuft gerade kein solches Programm bei dir, lehne ab.'
            : 'Dorthin geht der Code, mit dem die App den Zugriff abholt. Gehört die Adresse nicht zu der App, die du gerade geöffnet hast, lehne ab.'}
          {host.punycode &&
            ' xn-- steht für Sonderzeichen in der Adresse, etwa ein é statt eines e. Prüfe sie Zeichen für Zeichen.'}
        </p>
      </section>

      <section aria-labelledby="consent-gets" className="space-y-2">
        <h2 id="consent-gets" className="text-xs font-semibold tracking-wide uppercase">
          Was die App bekommt
        </h2>
        <ul className="space-y-2 text-sm">
          {scopes.known.map((label) => (
            <li key={label} className="flex items-start gap-2.5">
              <Eye className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                {label} als {formatDisplayName(identity.displayName)} ({identity.email})
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Höchstens die Rolle {ROLE_LABELS.viewer}
              {identity.role !== 'viewer' &&
                `, auch wenn dein Konto mehr darf (${ROLE_LABELS[identity.role]})`}
            </span>
          </li>
          {scopes.unknown.length === 0 ? (
            <li className="flex items-start gap-2.5">
              <Ban className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Ändern kann die App nichts. Du kannst sie jederzeit unter „Mein Konto“ trennen.
              </span>
            </li>
          ) : (
            scopes.unknown.map((scope) => (
              <li key={scope} className="flex items-start gap-2.5 text-amber-300">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Weitere Berechtigung, die diese Seite nicht beschreiben kann:{' '}
                  <code className={SYSTEM_MONO}>{scope}</code>
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      {age?.stale && (
        <Notice>
          Diese Anfrage wurde {age.text}. Wer eine Verbindung gerade in der App startet, landet nach
          wenigen Sekunden hier. Hast du sie nicht eben selbst gestartet, lehne ab.
        </Notice>
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={busy} onClick={() => void decide('deny')}>
          {phase === 'deny' && <Loader2 className="animate-spin" />}
          Ablehnen
        </Button>
        <Button disabled={busy} onClick={() => void decide('approve')}>
          {phase === 'approve' && <Loader2 className="animate-spin" />}
          Zugriff erlauben
        </Button>
      </div>

      {phase === 'redirecting' && target && (
        <p className="text-muted-foreground text-xs" role="status">
          Weiter zu {request.redirectHost}. Passiert nichts,{' '}
          <a href={target} className="text-primary underline underline-offset-2">
            hier klicken
          </a>
          .
        </p>
      )}

      <div className="border-border/50 space-y-1 border-t pt-4">
        <SignedInAs />
        {minutesLeft !== null && (
          <p className="text-muted-foreground text-xs">
            Die Anfrage {age ? `wurde ${age.text} und gilt` : 'gilt'} noch{' '}
            {minutesLeft === 1 ? 'eine Minute' : `${minutesLeft} Minuten`}.
          </p>
        )}
      </div>
    </ConsentCard>
  );
}

/**
 * `/admin/oauth/consent?request=<id>`: the page the API's authorize endpoint sends the browser to.
 * It asks the signed-in admin to approve or deny, then follows the `redirectTo` the API returns.
 */
export default function OAuthConsentPage() {
  return (
    <Suspense
      fallback={
        <ConsentCard>
          <LoadingState label="Anfrage wird geladen…" />
        </ConsentCard>
      }
    >
      <Consent />
    </Suspense>
  );
}
