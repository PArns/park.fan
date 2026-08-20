'use client';

import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, Plus, ShieldCheck, UserCog, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import type { AdminIdentity, AdminRole } from '../_lib/types';
import {
  Chip,
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  SkeletonRows,
} from '../_ui/primitives';
import { Field, Select, Switch, TextInput } from '../_ui/controls';
import { useToast } from '../_ui/toast';
import { useSession } from '../_app/session';

/**
 * Who may do what.
 *
 * Owner-only, and the API says so too — this page hiding itself from an editor
 * is a courtesy, not the control. The roles are ranked rather than listed, so
 * "editor or above" keeps meaning that when a role is added between them.
 */

const ROLES: Array<{ value: AdminRole; label: string; hint: string }> = [
  { value: 'owner', label: 'Inhaber', hint: 'Verwaltet Konten und darf alles, auch Merges und Cache-Resets.' },
  { value: 'editor', label: 'Redaktion', hint: 'Kuratiert Parks, Fahrgeschäfte und Saisons.' },
  { value: 'author', label: 'Autor', hint: 'Blog und Medien, keine Parkdaten.' },
  { value: 'viewer', label: 'Lesend', hint: 'Sieht die Dashboards, ändert nichts.' },
];

const ROLE_LABEL = Object.fromEntries(ROLES.map((role) => [role.value, role.label]));

export default function UsersPage() {
  const { identity } = useSession();
  const [creating, setCreating] = useState(false);

  const users = useAdminQuery<{ users: AdminIdentity[] }>(
    adminKeys.users,
    '/api/admin/auth/users'
  );

  if (identity.role !== 'owner') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Nur für Inhaber"
        description="Kontenverwaltung ist der Rolle „Inhaber“ vorbehalten."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <Panel>
        <PanelHeader
          icon={UserCog}
          title="Konten"
          hint="Jede Kuratierung trägt den Namen des Kontos, das sie geschrieben hat."
          action={
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Konto anlegen
            </Button>
          }
        />

        {users.isError ? (
          <ErrorState message={users.error.message} />
        ) : users.isLoading ? (
          <SkeletonRows rows={3} />
        ) : (
          <PanelBody className="space-y-2">
            {(users.data?.users ?? []).map((user) => (
              <UserRow key={user.id} user={user} isSelf={user.id === identity.id} />
            ))}
          </PanelBody>
        )}
      </Panel>

      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function UserRow({ user, isSelf }: { user: AdminIdentity; isSelf: boolean }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/auth/users/${user.id}`, { method: 'PATCH', body });
      invalidate(adminKeys.users);
    } catch (error) {
      toast.push({
        title: 'Änderung abgelehnt',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setBusy(true);
    try {
      await adminFetch(`/api/admin/auth/users/${user.id}/reset-password`, {
        method: 'POST',
        body: { newPassword },
      });
      setResetting(false);
      setNewPassword('');
      invalidate(adminKeys.users);
      toast.push({
        title: 'Passwort zurückgesetzt',
        description:
          'Alle Sitzungen des Kontos sind beendet. Es muss sich beim nächsten Login ein eigenes wählen.',
        tone: 'success',
      });
    } catch (error) {
      toast.push({
        title: 'Zurücksetzen fehlgeschlagen',
        description: error instanceof Error ? error.message : undefined,
        tone: 'error',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border/60 bg-card/40 space-y-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {user.displayName}
            {isSelf && <span className="text-muted-foreground ml-1.5 text-xs">(du)</span>}
          </p>
          <p className="text-muted-foreground truncate text-xs">{user.email}</p>
        </div>

        {user.totpEnabled && <Chip tone="success">2FA</Chip>}
        {user.mustChangePassword && <Chip tone="warning">Passwort offen</Chip>}
        {user.isActive === false && <Chip tone="danger">deaktiviert</Chip>}

        <span className="text-muted-foreground shrink-0 text-xs">
          {user.lastLoginAt
            ? formatDistanceToNow(parseISO(user.lastLoginAt), { addSuffix: true, locale: de })
            : 'nie angemeldet'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={user.role}
          allowEmpty={false}
          disabled={busy}
          onValueChange={(value) => value && patch({ role: value })}
          options={ROLES.map((role) => ({
            value: role.value,
            label: role.label,
            hint: role.hint,
          }))}
          className="h-8 w-40 text-xs"
        />

        <Switch
          checked={user.isActive !== false}
          disabled={busy}
          onCheckedChange={(next) => patch({ isActive: next })}
          label={<span className="text-xs">aktiv</span>}
        />

        <button
          type="button"
          onClick={() => setResetting((current) => !current)}
          className="text-muted-foreground hover:text-foreground ml-auto text-xs"
        >
          Passwort zurücksetzen
        </button>
      </div>

      {resetting && (
        <div className="border-border/50 flex flex-wrap items-end gap-2 border-t pt-2">
          <Field label="Neues Einmal-Passwort" className="min-w-56 flex-1">
            <TextInput
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="mindestens 12 Zeichen"
            />
          </Field>
          <Button size="sm" onClick={resetPassword} disabled={busy || newPassword.length < 12}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Setzen
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await adminFetch('/api/admin/auth/users', {
        method: 'POST',
        body: {
          email: email.trim(),
          displayName: displayName.trim() || undefined,
          role,
          password,
        },
      });
      invalidate(adminKeys.users);
      toast.push({
        title: 'Konto angelegt',
        description: 'Das Passwort gilt genau einmal — danach muss das Konto ein eigenes wählen.',
        tone: 'success',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anlegen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konto anlegen</DialogTitle>
          <DialogDescription>
            Das Passwort ist ein Einmal-Passwort: das Konto kommt damit nur bis zum
            Formular für ein eigenes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="E-Mail">
            <TextInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Anzeigename" hint="Leer = der Teil vor dem @.">
            <TextInput
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </Field>
          <Field label="Rolle">
            <Select
              value={role}
              allowEmpty={false}
              onValueChange={(value) => setRole((value as AdminRole) ?? 'editor')}
              options={ROLES.map((entry) => ({
                value: entry.value,
                label: entry.label,
                hint: entry.hint,
              }))}
            />
          </Field>
          <Field label="Einmal-Passwort" hint="Mindestens 12 Zeichen.">
            <TextInput value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={create}
              disabled={busy || password.length < 12 || email.trim().length === 0}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Anlegen ({ROLE_LABEL[role]})
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose} disabled={busy}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
