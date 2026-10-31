'use client';

import { useState } from 'react';
import { KeyRound, Loader2, PlugZap, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../../_lib/api';
import { Field, NumberInput, Switch, TextInput } from '../../_ui/controls';
import {
  AdminPage,
  ErrorState,
  LoadingState,
  Meta,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
} from '../../_ui/primitives';
import { useToast } from '../../_ui/toast';
import {
  ASSISTANT_API,
  formatCount,
  formatDateTime,
  type AssistantSettings,
} from '../_lib/assistant';

const SETTINGS_PATH = `${ASSISTANT_API}/settings`;

/**
 * Parky's switches and the Claude key. The key is write-only: the API hands back a masked form
 * and nothing else, so the field below always starts empty.
 */
export default function AssistantSettingsPage() {
  const query = useAdminQuery<AssistantSettings>(adminKeys.raw(SETTINGS_PATH), SETTINGS_PATH);

  if (query.error) return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  if (!query.data) return <LoadingState label="Lädt Einstellungen…" />;
  // Remounting on a new save resets the form to what the API now holds.
  return <SettingsForm key={query.data.updatedAt ?? 'new'} settings={query.data} />;
}

function SettingsForm({ settings }: { settings: AssistantSettings }) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [rollout, setRollout] = useState<number | null>(settings.rolloutPercent);
  const [budget, setBudget] = useState<number | null>(settings.dailyTokenBudget);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState<null | 'save' | 'remove' | 'test'>(null);

  const save = async (body: Record<string, unknown>, kind: 'save' | 'remove', title: string) => {
    setBusy(kind);
    try {
      await adminFetch(SETTINGS_PATH, { method: 'PUT', body });
      setApiKey('');
      invalidate(adminKeys.raw(SETTINGS_PATH), adminKeys.raw(`${ASSISTANT_API}/stats`));
      toast.push({ title, tone: 'success' });
    } catch (error) {
      toast.push({
        title: 'Nicht gespeichert',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    try {
      const result = await adminFetch<{ ok: boolean; error?: string }>(`${SETTINGS_PATH}/test`, {
        method: 'POST',
      });
      toast.push(
        result.ok
          ? { title: 'Key funktioniert', tone: 'success' }
          : { title: 'Key funktioniert nicht', description: result.error, tone: 'error' }
      );
    } catch (error) {
      toast.push({
        title: 'Test fehlgeschlagen',
        description: (error as Error).message,
        tone: 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  const rolloutValid = rollout !== null && rollout >= 0 && rollout <= 100;
  const budgetValid = budget !== null && budget >= 0;

  return (
    <AdminPage width="narrow">
      {!settings.secretConfigured && (
        <Notice>
          <code>ASSISTANT_SECRET_KEY</code> fehlt in der API. Ohne ihn kann kein Key gespeichert
          oder gelesen werden, und Parky bleibt aus.
        </Notice>
      )}

      <Panel>
        <PanelHeader
          icon={KeyRound}
          title="Claude-Key"
          hint="Wird verschlüsselt in der API gespeichert und nie wieder angezeigt."
        />
        <PanelBody className="space-y-3">
          <Meta label="Gespeichert" value={settings.apiKeyMasked ?? 'kein Key'} />
          <Field label="Neuer Key" htmlFor="assistant-key" hint="Beginnt mit sk-ant-">
            <TextInput
              id="assistant-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-ant-…"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={!apiKey.trim() || busy !== null || !settings.secretConfigured}
              onClick={() => save({ apiKey: apiKey.trim() }, 'save', 'Key gespeichert')}
            >
              {busy === 'save' && <Loader2 className="animate-spin" />}
              Key speichern
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!settings.apiKeyMasked || busy !== null}
              onClick={test}
            >
              {busy === 'test' ? <Loader2 className="animate-spin" /> : <PlugZap />}
              Testen
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!settings.apiKeyMasked || busy !== null}
              onClick={() => {
                if (confirm('Key entfernen? Parky ist danach aus.')) {
                  void save({ apiKey: null }, 'remove', 'Key entfernt');
                }
              }}
            >
              {busy === 'remove' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Entfernen
            </Button>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="Rollout"
          hint={
            <>
              Im Admin angemeldet siehst du Parky immer; mit <code>?assistant=on</code> erscheint er
              auch anderen bei 0 % oder ausgeschaltet. Der Schalter regelt nur den öffentlichen
              Rollout, ganz stoppt Parky erst ohne Key.
            </>
          }
        />
        <PanelBody className="space-y-4">
          <Switch checked={enabled} onCheckedChange={setEnabled} label="Parky ist an" />
          <Field
            label="Anteil der Besucher (%)"
            htmlFor="assistant-rollout"
            hint="Jeder Browser bekommt einen festen Platz 0–99 und sieht Parky, wenn er darunter liegt."
            error={rolloutValid ? null : 'Zwischen 0 und 100'}
          >
            <NumberInput
              id="assistant-rollout"
              min={0}
              max={100}
              value={rollout}
              onValueChange={setRollout}
            />
          </Field>
          <Field
            label="Tagesbudget (Tokens)"
            htmlFor="assistant-budget"
            hint={`Heute verbraucht: ${formatCount(settings.tokensToday)}. Ist es erreicht, schaltet Parky sich bis Mitternacht UTC ab. 0 = kein Limit.`}
            error={budgetValid ? null : 'Mindestens 0'}
          >
            <NumberInput
              id="assistant-budget"
              min={0}
              step={100000}
              value={budget}
              onValueChange={setBudget}
            />
          </Field>
          <Button
            size="sm"
            disabled={!rolloutValid || !budgetValid || busy !== null}
            onClick={() =>
              save(
                { enabled, rolloutPercent: rollout, dailyTokenBudget: budget },
                'save',
                'Einstellungen gespeichert'
              )
            }
          >
            {busy === 'save' && <Loader2 className="animate-spin" />}
            Speichern
          </Button>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Meta label="Modell" value={settings.model} />
          <Meta label="Prompt-Version" value={settings.promptVersion} />
          <Meta label="Geändert von" value={settings.updatedBy ?? '–'} />
          <Meta
            label="Geändert"
            value={settings.updatedAt ? formatDateTime(settings.updatedAt) : '–'}
          />
        </PanelBody>
      </Panel>
    </AdminPage>
  );
}
