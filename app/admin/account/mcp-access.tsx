'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Loader2, Plug, Plus, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CLAUDE_CODE_ADD_COMMAND,
  MCP_SERVER_NAME,
  MCP_URL,
  TOKEN_EXPIRY_OPTIONS,
  apiTokenKey,
  claudeCodeAddCommandWithToken,
  type CreatedAdminApiToken,
} from '@/lib/admin/mcp';
import { adminFetch, useInvalidateAdmin } from '../_lib/api';
import { ApiTokenList } from '../_ui/api-token-list';
import { Field, Select, TextInput } from '../_ui/controls';
import { CodeBlock } from '../_ui/code-block';
import { CopyButton } from '../_ui/copy-button';
import { Panel, PanelBody, PanelHeader, Tile } from '../_ui/primitives';
import { useToast } from '../_ui/toast';
import { useSession } from '../_app/session';

const NEVER = 'never';
const DEFAULT_EXPIRY = '90';

/** The select's values are strings; `never` stands for the token that does not expire. */
const EXPIRY_SELECT_OPTIONS = TOKEN_EXPIRY_OPTIONS.map((option) => ({
  value: option.days === null ? NEVER : String(option.days),
  label: option.label,
}));

/**
 * The account page's section for the API's MCP server: its address, how to connect Claude to it,
 * and the personal tokens and OAuth connections of this account with a revoke button each.
 */
export function McpAccessPanel() {
  const [creating, setCreating] = useState(false);

  return (
    <Panel>
      <PanelHeader
        icon={Plug}
        title="API-Zugriff / MCP"
        hint="Claude liest den Admin mit deinem Konto, aber nur mit der Rolle Lesend, auch wenn dein Konto mehr darf."
        action={
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Token erstellen
          </Button>
        }
      />
      <PanelBody className="space-y-4">
        <Tile title="Adresse" action={<CopyButton value={MCP_URL} />}>
          <CodeBlock>{MCP_URL}</CodeBlock>
        </Tile>

        <Tile
          title="Claude Code"
          hint={`Server hinzufügen, danach in Claude Code /mcp öffnen und ${MCP_SERVER_NAME} anmelden.`}
          action={<CopyButton value={CLAUDE_CODE_ADD_COMMAND} />}
        >
          <CodeBlock>{CLAUDE_CODE_ADD_COMMAND}</CodeBlock>
        </Tile>

        <Tile
          title="claude.ai"
          hint="In den Einstellungen unter „Konnektoren“ einen benutzerdefinierten Konnektor mit der Adresse oben hinzufügen. Beim Verbinden fragt park.fan hier, ob du den Zugriff erlaubst."
        />

        <div className="space-y-2 pt-1">
          <div>
            <h3 className="text-sm font-semibold">Tokens und Verbindungen</h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Ein Token ist für Skripte und Rechner ohne Browser. Eine App, die sich über die
              Anmeldung verbunden hat, steht hier als Verbindung.
            </p>
          </div>
          <ApiTokenList />
        </div>
      </PanelBody>

      {creating && <CreateTokenDialog onClose={() => setCreating(false)} />}
    </Panel>
  );
}

function CreateTokenDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const { identity } = useSession();
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState(DEFAULT_EXPIRY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedAdminApiToken | null>(null);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || name.trim().length === 0) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<CreatedAdminApiToken>('/api/admin/auth/tokens', {
        method: 'POST',
        body: {
          name: name.trim(),
          expiresInDays: expiry === NEVER ? null : Number(expiry),
        },
      });
      setCreated(result);
      invalidate(apiTokenKey());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erstellen fehlgeschlagen');
      toast.push({ title: 'Token nicht erstellt', tone: 'error' });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  // The secret exists only in this response, so the overlay and Escape do not dismiss it: only the
  // button does, after the person has seen the warning.
  const holdsSecret = created !== null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-xl"
        showCloseButton={!holdsSecret}
        onInteractOutside={(event) => holdsSecret && event.preventDefault()}
        onEscapeKeyDown={(event) => holdsSecret && event.preventDefault()}
      >
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Token erstellt</DialogTitle>
              <DialogDescription>
                {created.item.name ?? 'Das Token'} liest den Admin als {identity.email}, nur lesend.
              </DialogDescription>
            </DialogHeader>

            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Das Token wird nur jetzt angezeigt. Danach lässt es sich nicht mehr abrufen. Geht es
                verloren, widerrufst du es und erstellst ein neues.
              </p>
            </div>

            <Tile title="Token" action={<CopyButton value={created.token} />}>
              <CodeBlock breakAnywhere>{created.token}</CodeBlock>
            </Tile>

            <Tile
              title="In Claude Code"
              hint="Für einen Rechner, auf dem sich kein Browser zur Anmeldung öffnen lässt."
              action={<CopyButton value={claudeCodeAddCommandWithToken(created.token)} />}
            >
              <CodeBlock>{claudeCodeAddCommandWithToken(created.token)}</CodeBlock>
            </Tile>

            <DialogFooter>
              <Button onClick={onClose}>Fertig</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={(event) => void create(event)} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Token erstellen</DialogTitle>
              <DialogDescription>
                Ein Token liest den Admin mit deinem Konto, nur lesend. Für Claude reicht die
                Anmeldung, ein Token brauchst du für Skripte und Rechner ohne Browser.
              </DialogDescription>
            </DialogHeader>

            <Field label="Name" hint="Damit du das Token später wiedererkennst.">
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="z. B. Laptop"
                autoComplete="off"
              />
            </Field>
            <Field label="Gültig" hint="Ein Token ohne Ablauf gilt, bis du es widerrufst.">
              <Select
                value={expiry}
                allowEmpty={false}
                onValueChange={(value) => setExpiry(value ?? expiry)}
                options={EXPIRY_SELECT_OPTIONS}
              />
            </Field>

            {error && <p className="text-destructive text-xs">{error}</p>}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy || name.trim().length === 0}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Erstellen
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
