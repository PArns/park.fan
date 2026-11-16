'use client';

import { Activity } from 'lucide-react';
import { adminKeys, useAdminQuery } from '../../_lib/api';
import { ErrorState, Panel, PanelBody, PanelHeader, SkeletonRows } from '../../_ui/primitives';
import { cn } from '@/lib/utils';

/** One day's counts from `GET /v1/admin/auth/attempts`, keyed `<kind>:<outcome>`. */
interface AttemptDay {
  date: string;
  counts: Record<string, number>;
}

/** The rows, grouped by what was tried; `alert` marks outcomes worth a second look. */
const GROUPS: { title: string; rows: { key: string; label: string; alert?: boolean }[] }[] = [
  {
    title: 'Anmeldung',
    rows: [
      { key: 'login:success-staff', label: 'Erfolgreich: Redaktion' },
      { key: 'login:success-developer', label: 'Erfolgreich: Entwickler' },
      { key: 'login:success-user', label: 'Erfolgreich: Besucher' },
      { key: 'login:wrong-credentials', label: 'Falsche Zugangsdaten', alert: true },
      { key: 'login:totp-required', label: 'Zweiter Faktor angefragt' },
      { key: 'login:locked', label: 'Konto gesperrt', alert: true },
      { key: 'login:rate-limited', label: 'Zu viele Versuche', alert: true },
      { key: 'login:turnstile-failed', label: 'Turnstile nicht gelöst', alert: true },
    ],
  },
  {
    title: 'Besucherkonto anlegen',
    rows: [
      { key: 'register-user:created', label: 'Angelegt' },
      { key: 'register-user:closed', label: 'Abgewiesen: Registrierung geschlossen' },
      { key: 'register-user:exists', label: 'Adresse schon vergeben' },
      { key: 'register-user:turnstile-failed', label: 'Turnstile nicht gelöst', alert: true },
      { key: 'register-user:failed', label: 'Sonstiger Fehler', alert: true },
    ],
  },
  {
    title: 'Entwicklerkonto anlegen',
    rows: [
      { key: 'register-developer:created', label: 'Angelegt' },
      { key: 'register-developer:exists', label: 'Adresse schon vergeben' },
      { key: 'register-developer:turnstile-failed', label: 'Turnstile nicht gelöst', alert: true },
      { key: 'register-developer:failed', label: 'Sonstiger Fehler', alert: true },
    ],
  },
];

/** The sum of one key over the last `span` days (the list is oldest first). */
function sum(days: AttemptDay[], key: string, span: number): number {
  return days.slice(-span).reduce((total, day) => total + (day.counts[key] ?? 0), 0);
}

/**
 * How many sign in and how many try to make an account, per outcome: today, 7 and 30 days. The
 * API counts numbers only; who tried is not stored. Our frontend checks Turnstile before it
 * forwards, so „Turnstile nicht gelöst“ counts direct callers of the API.
 */
export function AttemptsPanel() {
  const attempts = useAdminQuery<{ days: AttemptDay[] }>(
    adminKeys.authAttempts,
    '/api/admin/auth/attempts?days=30'
  );
  const days = attempts.data?.days ?? [];

  return (
    <Panel>
      <PanelHeader
        icon={Activity}
        title="Anmeldeversuche"
        hint="Anmeldungen und Registrierungen nach Ergebnis, ohne Adresse und ohne Konto. Tage in UTC."
      />
      {attempts.isError ? (
        <ErrorState message={attempts.error.message} />
      ) : attempts.isLoading ? (
        <SkeletonRows rows={4} />
      ) : (
        <PanelBody className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-muted-foreground text-xs">
              <tr>
                <th className="py-1.5 text-left font-medium" />
                <th className="w-16 py-1.5 text-right font-medium">Heute</th>
                <th className="w-16 py-1.5 text-right font-medium">7 Tage</th>
                <th className="w-16 py-1.5 text-right font-medium">30 Tage</th>
              </tr>
            </thead>
            {GROUPS.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th
                    colSpan={4}
                    className="text-muted-foreground pt-4 pb-1 text-left text-[11px] font-medium tracking-wide uppercase"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => {
                  const month = sum(days, row.key, 30);
                  return (
                    <tr key={row.key} className="border-border/40 border-t">
                      <td className="py-1.5">{row.label}</td>
                      {[1, 7, 30].map((span) => {
                        const value = span === 30 ? month : sum(days, row.key, span);
                        return (
                          <td
                            key={span}
                            className={cn(
                              'py-1.5 text-right',
                              value === 0 && 'text-muted-foreground/50',
                              value > 0 && row.alert && 'text-amber-500'
                            )}
                          >
                            {value.toLocaleString('de-DE')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </PanelBody>
      )}
    </Panel>
  );
}
