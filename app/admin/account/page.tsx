'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  Loader2,
  Monitor,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import type { AdminSessionInfo } from '../_lib/types';
import { Chip, Panel, PanelBody, PanelHeader, SkeletonRows } from '../_ui/primitives';
import { Field, TextInput } from '../_ui/controls';
import { useToast } from '../_ui/toast';
import { useSession } from '../_app/session';

/**
 * The account's own settings: password, second factor, live sessions.
 *
 * The sessions list is the part worth having. An admin session unlocks
 * destructive operations, so "where am I signed in" and "end that one" have to
 * be answerable by the person themselves rather than by an owner filing a
 * request — and because the tokens are opaque and stored server-side, ending
 * one genuinely ends it, immediately.
 */
export default function AccountPage() {
  const { identity } = useSession();

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="text-xl font-bold">{identity.displayName}</h1>
        <p className="text-muted-foreground text-sm">{identity.email}</p>
      </header>

      <PasswordPanel />
      <TotpPanel enabled={identity.totpEnabled} />
      <SessionsPanel />
    </div>
  );
}

// ─── password ─────────────────────────────────────────────────────────────────

function PasswordPanel() {
  const toast = useToast();
  const client = useQueryClient();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = next.length > 0 && next.length < 12;
  const mismatch = repeat.length > 0 && repeat !== next;

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/auth/change-password', {
        method: 'POST',
        body: { currentPassword: current, newPassword: next },
      });
      setCurrent('');
      setNext('');
      setRepeat('');
      await client.invalidateQueries({ queryKey: adminKeys.sessions });
      toast.push({
        title: 'Passwort geändert',
        description: 'Alle anderen Sitzungen dieses Kontos wurden beendet.',
        tone: 'success',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={KeyRound}
        title="Passwort"
        hint="Eine Änderung beendet jede andere Sitzung dieses Kontos — diese hier bleibt."
      />
      <PanelBody className="space-y-3">
        <Field label="Aktuell">
          <TextInput
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Neu" hint="Mindestens 12 Zeichen." error={tooShort ? 'Zu kurz.' : null}>
            <TextInput
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
          </Field>
          <Field label="Wiederholen" error={mismatch ? 'Stimmt nicht überein.' : null}>
            <TextInput
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            />
          </Field>
        </div>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <Button
          size="sm"
          onClick={submit}
          disabled={busy || tooShort || mismatch || next.length === 0 || current.length === 0}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Passwort ändern
        </Button>
      </PanelBody>
    </Panel>
  );
}

// ─── two-factor ───────────────────────────────────────────────────────────────

function TotpPanel({ enabled }: { enabled: boolean }) {
  const toast = useToast();
  const { refresh } = useSession();
  const [enrolment, setEnrolment] = useState<{ secret: string; uri: string } | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<{ secret: string; uri: string }>(
        '/api/admin/auth/totp/begin',
        { method: 'POST' }
      );
      setEnrolment(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/auth/totp/confirm', { method: 'POST', body: { code } });
      setEnrolment(null);
      setCode('');
      refresh();
      toast.push({ title: 'Zwei-Faktor aktiviert', tone: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Code stimmt nicht');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/auth/totp/disable', {
        method: 'POST',
        body: { password, code },
      });
      setPassword('');
      setCode('');
      refresh();
      toast.push({ title: 'Zwei-Faktor deaktiviert', tone: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        icon={enabled ? ShieldCheck : ShieldOff}
        title="Zwei-Faktor"
        hint={
          enabled
            ? 'Aktiv. Zum Abschalten braucht es Passwort UND einen gültigen Code.'
            : 'Nicht aktiv. Ein gestohlenes Passwort reicht damit für den vollen Zugriff.'
        }
        action={enabled ? <Chip tone="success">aktiv</Chip> : <Chip tone="warning">aus</Chip>}
      />
      <PanelBody className="space-y-3">
        {!enabled && !enrolment && (
          <Button size="sm" variant="outline" onClick={begin} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Einrichten
          </Button>
        )}

        {enrolment && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs">
              Scanne den Code, oder trage das Geheimnis von Hand ein. Zwei-Faktor wird erst aktiv,
              wenn ein Code aus der App hier ankommt — so kann ein misslungener Scan niemanden
              aussperren.
            </p>
            {/* No QR code, and that is deliberate rather than lazy. Every
                hosted QR generator works by taking the payload in the URL —
                and the payload here IS the shared secret. Rendering one would
                mean posting the second factor to a third party at the moment
                it is created, which is a worse outcome than typing 32
                characters once. Encoding it in-process would be ~600 lines of
                QR encoder for an action each account performs exactly once.
                Password managers accept the otpauth:// link below directly. */}
            <div className="space-y-3">
              <div className="min-w-0 space-y-2">
                <Field
                  label="Geheimnis"
                  hint="In der Authenticator-App als „manuell eingeben“ / „Setup-Schlüssel“."
                >
                  <code className="border-border/60 bg-muted/40 block rounded-lg border px-3 py-2 font-mono text-sm tracking-wider break-all">
                    {enrolment.secret}
                  </code>
                </Field>
                <a
                  href={enrolment.uri}
                  className="text-primary inline-block text-xs hover:underline"
                >
                  In der Passwort-App öffnen (otpauth://)
                </a>
                <Field label="Code aus der App">
                  <TextInput
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    className="tracking-[0.3em] tabular-nums"
                  />
                </Field>
                <Button size="sm" onClick={confirm} disabled={busy || code.length !== 6}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Aktivieren
                </Button>
              </div>
            </div>
          </div>
        )}

        {enabled && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Passwort">
              <TextInput
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
            <Field label="Aktueller Code">
              <TextInput
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <div className="flex items-end">
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={disable}
                disabled={busy || code.length !== 6 || password.length === 0}
              >
                Deaktivieren
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-destructive text-xs">{error}</p>}
      </PanelBody>
    </Panel>
  );
}

// ─── sessions ─────────────────────────────────────────────────────────────────

function SessionsPanel() {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const sessions = useAdminQuery<{ sessions: AdminSessionInfo[] }>(
    adminKeys.sessions,
    '/api/admin/auth/sessions'
  );

  async function revoke(id: string) {
    await adminFetch(`/api/admin/auth/sessions/${id}`, { method: 'DELETE' });
    invalidate(adminKeys.sessions);
    toast.push({ title: 'Sitzung beendet', tone: 'success' });
  }

  return (
    <Panel>
      <PanelHeader
        icon={Monitor}
        title="Aktive Sitzungen"
        hint="Jede angemeldete Stelle. Beenden wirkt sofort — die Token liegen serverseitig."
      />
      {sessions.isLoading ? (
        <SkeletonRows rows={2} />
      ) : (
        <PanelBody className="space-y-2">
          {(sessions.data?.sessions ?? []).map((session) => (
            <div
              key={session.id}
              className="border-border/60 bg-card/40 flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <Smartphone className="text-muted-foreground h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {session.userAgent ?? 'Unbekanntes Gerät'}
                  {session.current && (
                    <Chip tone="primary" className="ml-2">
                      diese
                    </Chip>
                  )}
                </p>
                <p className="text-muted-foreground text-xs">
                  {session.ip ?? 'unbekannt'} ·{' '}
                  {formatDistanceToNow(parseISO(session.lastSeenAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                </p>
              </div>
              {!session.current && (
                <button
                  type="button"
                  onClick={() => void revoke(session.id)}
                  aria-label="Sitzung beenden"
                  className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </PanelBody>
      )}
    </Panel>
  );
}
