'use client';

import { useState } from 'react';
import { Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  APP_CONFIG_API,
  APP_MESSAGE_LANGUAGES,
  APP_PLATFORMS,
  APP_VERSION_PATTERN,
  appConfigBody,
  isAppConfigBackendMissing,
  raisesMinimum,
  type AppConfigView,
  type AppPlatform,
} from '@/lib/admin/app-config';
import { useCan } from '../_app/session';
import { adminFetch, adminKeys, useAdminQuery, useInvalidateAdmin } from '../_lib/api';
import { formatAgo } from '../_lib/format';
import { Field, TextInput } from '../_ui/controls';
import {
  AdminPage,
  Chip,
  ErrorState,
  LoadingState,
  Notice,
  Panel,
  PanelBody,
  PanelHeader,
} from '../_ui/primitives';
import { useToast } from '../_ui/toast';

/**
 * The minimum app version per platform: an app below it shows a block screen instead of starting.
 * The sample fields ask the API what an app of that version would meet.
 */
export default function AppVersionPage() {
  const [sample, setSample] = useState({ version: '1.0.0', build: '' });
  const valid = APP_VERSION_PATTERN.test(sample.version);
  const params = new URLSearchParams();
  if (valid) params.set('version', sample.version);
  if (/^\d+$/.test(sample.build)) params.set('build', sample.build);
  const path = `${APP_CONFIG_API}?${params}`;
  const query = useAdminQuery<AppConfigView>(adminKeys.raw(path), path, {
    placeholderData: (previous) => previous,
  });

  if (isAppConfigBackendMissing(query.error)) {
    return (
      <AdminPage width="narrow">
        <Notice>Die API kennt diese Seite noch nicht. Sie kommt mit ihrem nächsten Deploy.</Notice>
      </AdminPage>
    );
  }
  if (query.error) return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  if (!query.data) return <LoadingState label="Lädt App-Versionen…" />;
  const view = query.data;

  return (
    <AdminPage width="narrow">
      <Notice>
        Alle, die eine ältere Version als das Minimum nutzen, sind ausgesperrt, bis sie die App
        aktualisieren. Leere Felder heißen: kein Minimum.
      </Notice>
      <Panel>
        <PanelHeader
          icon={Smartphone}
          title="Testversion"
          hint="Was die API zu einer App dieser Version sagen würde."
        />
        <PanelBody className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Version" htmlFor="sample-version">
              <TextInput
                id="sample-version"
                value={sample.version}
                onChange={(event) => setSample({ ...sample, version: event.target.value })}
              />
            </Field>
            <Field label="Build" htmlFor="sample-build">
              <TextInput
                id="sample-build"
                inputMode="numeric"
                value={sample.build}
                onChange={(event) => setSample({ ...sample, build: event.target.value })}
              />
            </Field>
          </div>
          <ul className="space-y-1.5">
            {APP_PLATFORMS.map((platform) => (
              <li key={platform.id} className="flex items-center gap-2 text-sm">
                <Chip tone={view.samples[platform.id].blocked ? 'danger' : 'success'}>
                  {platform.label}
                </Chip>
                {view.samples[platform.id].text}
              </li>
            ))}
          </ul>
        </PanelBody>
      </Panel>
      {APP_PLATFORMS.map((platform) => (
        <PlatformForm
          key={`${platform.id}:${view.updatedAt}`}
          platform={platform}
          view={view}
          path={path}
        />
      ))}
    </AdminPage>
  );
}

function PlatformForm({
  platform,
  view,
  path,
}: {
  platform: (typeof APP_PLATFORMS)[number];
  view: AppConfigView;
  path: string;
}) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const owner = useCan('owner');
  const current = view.platforms[platform.id as AppPlatform];
  const [form, setForm] = useState({
    minVersion: current.minVersion ?? '',
    minBuild: current.minBuild?.toString() ?? '',
    updateUrl: current.updateUrl ?? '',
    message: { ...current.message } as Record<string, string>,
  });
  const [saving, setSaving] = useState(false);
  const body = appConfigBody(form);
  const problem =
    (body.minVersion &&
      !APP_VERSION_PATTERN.test(body.minVersion) &&
      'Version wie 1.0 oder 1.0.1') ||
    (form.minBuild.trim() && !/^[1-9]\d*$/.test(form.minBuild.trim()) && 'Build: ganze Zahl') ||
    (body.minBuild && !body.minVersion && 'Ein Build braucht eine Version') ||
    (body.updateUrl && !body.updateUrl.startsWith('https://') && 'Link mit https://') ||
    null;

  const save = async () => {
    if (
      raisesMinimum(current, body) &&
      !confirm(
        `Minimum ${platform.label} auf ${body.minVersion}${body.minBuild ? ` (${body.minBuild})` : ''} setzen? Alle mit einer älteren Version sind ausgesperrt, bis sie aktualisieren.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await adminFetch(`${APP_CONFIG_API}/${platform.id}`, { method: 'PUT', body });
      toast.push({ title: `${platform.label} gespeichert`, tone: 'success' });
    } catch (error) {
      toast.push({ title: 'Nicht geklappt', description: (error as Error).message, tone: 'error' });
    } finally {
      invalidate(adminKeys.raw(path), adminKeys.raw(APP_CONFIG_API));
      setSaving(false);
    }
  };

  return (
    <Panel>
      <PanelHeader
        icon={Smartphone}
        title={platform.label}
        hint={
          platform.prepared
            ? 'Vorbereitet: Es gibt noch keine Android-App. Die Felder gelten wie bei iOS.'
            : view.updatedAt
              ? `Zuletzt geändert ${formatAgo(view.updatedAt)}${view.updatedBy ? ` von ${view.updatedBy}` : ''}`
              : 'Noch nie gesetzt.'
        }
      />
      <PanelBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mindestversion" htmlFor={`${platform.id}-version`} hint="z. B. 1.0.1">
            <TextInput
              id={`${platform.id}-version`}
              value={form.minVersion}
              onChange={(event) => setForm({ ...form, minVersion: event.target.value })}
            />
          </Field>
          <Field
            label={platform.buildLabel}
            htmlFor={`${platform.id}-build`}
            hint="Gilt nur bei genau dieser Version."
          >
            <TextInput
              id={`${platform.id}-build`}
              inputMode="numeric"
              value={form.minBuild}
              onChange={(event) => setForm({ ...form, minBuild: event.target.value })}
            />
          </Field>
        </div>
        <Field
          label="Link zum Aktualisieren"
          htmlFor={`${platform.id}-url`}
          hint={platform.prepared ? 'Play-Store-Link.' : 'App-Store- oder TestFlight-Link.'}
        >
          <TextInput
            id={`${platform.id}-url`}
            value={form.updateUrl}
            onChange={(event) => setForm({ ...form, updateUrl: event.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {APP_MESSAGE_LANGUAGES.map((language) => (
            <Field
              key={language}
              label={`Hinweis ${language.toUpperCase()}`}
              htmlFor={`${platform.id}-msg-${language}`}
              hint="Leer: Text der App. Höchstens 300 Zeichen."
            >
              <TextInput
                id={`${platform.id}-msg-${language}`}
                maxLength={300}
                value={form.message[language] ?? ''}
                onChange={(event) =>
                  setForm({ ...form, message: { ...form.message, [language]: event.target.value } })
                }
              />
            </Field>
          ))}
        </div>
        {problem && <Notice role="alert">{problem}</Notice>}
        <Button size="sm" disabled={!owner || saving || !!problem} onClick={() => void save()}>
          {saving && <Loader2 className="animate-spin" />}
          Speichern
        </Button>
      </PanelBody>
    </Panel>
  );
}
