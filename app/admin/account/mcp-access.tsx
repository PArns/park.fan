'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Loader2, Plug, Plus } from 'lucide-react';
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
  createTokenBody,
  describeTokenCreateError,
  type CreatedAdminApiToken,
} from '@/lib/admin/mcp';
import { TOTP_CODE_LENGTH } from '@/lib/admin/totp';
import { AdminApiError, adminFetch, useInvalidateAdmin } from '../_lib/api';
import { ApiTokenList } from '../_ui/api-token-list';
import { Field, OtpInput, Select, TextInput, useFieldId } from '../_ui/controls';
import { CodeBlock } from '../_ui/code-block';
import { CopyButton } from '../_ui/copy-button';
import { Notice, Panel, PanelBody, PanelHeader, Tile } from '../_ui/primitives';
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
  const { identity, refresh } = useSession();
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState(DEFAULT_EXPIRY);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  // The session says whether the account has a second factor; the API's `totp-required` corrects it.
  const [needsCode, setNeedsCode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field: 'password' | 'code' | null; message: string } | null>(
    null
  );
  const [created, setCreated] = useState<CreatedAdminApiToken | null>(null);
  // A second submit can arrive before the first one's re-render disables the button.
  const submitting = useRef(false);
  const passwordField = useRef<HTMLInputElement>(null);
  const ids = {
    name: useFieldId('token-name'),
    password: useFieldId('token-password'),
    code: useFieldId('token-code'),
  };

  const askForCode = identity.totpEnabled || needsCode;
  const complete =
    name.trim().length > 0 &&
    password.length > 0 &&
    (!askForCode || code.length === TOTP_CODE_LENGTH);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !complete) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await adminFetch<CreatedAdminApiToken>('/api/admin/auth/tokens', {
        method: 'POST',
        body: createTokenBody({
          name,
          expiresInDays: expiry === NEVER ? null : Number(expiry),
          password,
          totpCode: askForCode ? code : '',
        }),
      });
      setCreated(result);
      invalidate(apiTokenKey());
    } catch (err) {
      const problem =
        err instanceof AdminApiError
          ? describeTokenCreateError(err.status, err.payload, err.message)
          : describeTokenCreateError(0, null, 'Erstellen fehlgeschlagen');
      if (problem.needsCode) setNeedsCode(true);
      setError({ field: problem.field, message: problem.message });
      toast.push({ title: 'Token nicht erstellt', tone: 'error' });
      if (problem.sessionEnded) refresh();
      // Both fields are emptied below, so the person starts again at the password.
      requestAnimationFrame(() => passwordField.current?.focus());
    } finally {
      // Neither outlives the request, whatever it answered.
      setPassword('');
      setCode('');
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

            <Notice role="alert">
              Das Token wird nur jetzt angezeigt. Danach lässt es sich nicht mehr abrufen. Geht es
              verloren, widerrufst du es und erstellst ein neues.
            </Notice>

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

            <Field label="Name" htmlFor={ids.name} hint="Damit du das Token später wiedererkennst.">
              <TextInput
                id={ids.name}
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
            <Field
              label="Passwort"
              htmlFor={ids.password}
              hint="Damit eine gestohlene Sitzung sich kein Token ausstellen kann, das sie überlebt. Es wird nur für diese Anfrage gebraucht."
            >
              <TextInput
                id={ids.password}
                ref={passwordField}
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={error?.field === 'password' || undefined}
              />
            </Field>
            {askForCode && (
              <Field
                label="Code"
                htmlFor={ids.code}
                hint="Der aktuelle Code aus deiner Authenticator-App."
              >
                <OtpInput
                  id={ids.code}
                  value={code}
                  onValueChange={setCode}
                  aria-invalid={error?.field === 'code' || undefined}
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="text-destructive text-xs">
                {error.message}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy || !complete}>
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
