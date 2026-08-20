'use client';

import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, AdminApiError } from '../_lib/api';
import { Field, TextInput } from '../_ui/controls';
import { useSession } from './session';

/**
 * The only screen an account with a temporary password can reach.
 *
 * A password that arrived over chat, or that sat in a deployment config, has
 * been seen by more than one person — so it gets the account created and
 * nothing else. The backend refuses every other endpoint for such a session;
 * this is the half that says so instead of letting the admin render and then
 * fail on each request.
 */
export function MustChangePassword() {
  const { identity, signOut } = useSession();
  const client = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tooShort = newPassword.length > 0 && newPassword.length < 12;
  const mismatch = repeat.length > 0 && repeat !== newPassword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || tooShort || mismatch || newPassword.length === 0) return;

    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      // The proxy has already moved the re-issued token into the cookie; all
      // this has to do is ask who we are again.
      await client.invalidateQueries({ queryKey: adminKeys.session });
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Passwort konnte nicht geändert werden.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/15">
            <ShieldAlert className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Neues Passwort wählen</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Das Passwort für {identity.email} war ein Einmal-Passwort. Solange es gilt, ist sonst
              nichts erreichbar.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-border/60 bg-card/70 space-y-4 rounded-xl border p-5 backdrop-blur-sm"
        >
          <Field label="Aktuelles Passwort" htmlFor="current-password">
            <div className="relative">
              <KeyRound className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <TextInput
                id="current-password"
                type="password"
                autoComplete="current-password"
                className="pl-9"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
          </Field>

          <Field
            label="Neues Passwort"
            htmlFor="new-password"
            hint="Mindestens 12 Zeichen. Länge ist die einzige Regel, eine Passphrase ist besser als ein kurzes Wort mit Sonderzeichen."
            error={tooShort ? 'Mindestens 12 Zeichen.' : null}
          >
            <TextInput
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Wiederholen"
            htmlFor="repeat-password"
            error={mismatch ? 'Stimmt nicht überein.' : null}
          >
            <TextInput
              id="repeat-password"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              required
            />
          </Field>

          {error && (
            <p className="bg-destructive/10 border-destructive/30 text-destructive rounded-lg border px-3 py-2 text-xs">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy || tooShort || mismatch}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Passwort setzen
          </Button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="text-muted-foreground hover:text-foreground w-full text-center text-xs"
          >
            Abmelden
          </button>
        </form>
      </div>
    </div>
  );
}
