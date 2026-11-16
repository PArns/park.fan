'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { BadgeCheck, CheckCircle2, CircleDollarSign, Loader2, Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { FormStep } from '@/components/common/form-step';
import { DATA_TERMS_ANCHOR } from '@/lib/agents/licensing';
import { cn } from '@/lib/utils';
import {
  API_PERMISSION_GROUPS,
  API_PERMISSION_GROUP_IDS,
  KEYLESS_PERMISSIONS,
  sortPermissions,
  type ApiPermission,
} from '@/lib/developers/permissions';
import {
  KEY_REQUEST_LIMITS,
  PLATFORMS,
  PROJECT_KINDS,
  REQUEST_VOLUMES,
  REVENUE_MODELS,
  SOURCE_MODELS,
  normalizeUrl,
  requestTier,
  toggleRevenue,
  type KeyRequestInput,
  type Platform,
  type ProjectKind,
  type RequestVolume,
  type RevenueModel,
  type SourceModel,
} from '@/lib/developers/key-request';
import { ATTRIBUTION_ANCHOR, DEVELOPERS_PATH } from '@/lib/developers/paths';
import { createKeyRequest } from '@/lib/developers/dashboard';
import { SessionApiError } from '@/lib/admin/session-client';

const L = KEY_REQUEST_LIMITS;

/** A field's element id, prefixed so it cannot collide with anything else on the page. */
const fid = (field: string) => `key-request-${field}`;

/** A labelled field: label, the control, and a hint under it. */
function Field({
  field,
  label,
  optional,
  hint,
  children,
}: {
  field: string;
  label: string;
  optional?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={fid(field)} className="text-sm font-medium">
        {label}
        {optional && <span className="text-muted-foreground font-normal"> ({optional})</span>}
      </label>
      {children}
      {hint && <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>}
    </div>
  );
}

/** A tick box or radio drawn as a bordered row, tinted while ticked, with an optional second line. */
function CheckRow({
  checked,
  onChange,
  type = 'checkbox',
  name,
  disabled,
  children,
  detail,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  type?: 'checkbox' | 'radio';
  name?: string;
  disabled?: boolean;
  children: ReactNode;
  detail?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors',
        checked ? 'border-primary/40 bg-primary/[5%]' : 'border-border',
        disabled && 'cursor-default opacity-70'
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-primary mt-0.5 size-4 shrink-0"
      />
      <span>
        <span className="font-medium">{children}</span>
        {detail && (
          <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
            {detail}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * The dashboard's key request: what the project is, where it runs, whether its source is open,
 * how it earns money, which permissions it needs, how it calls and caches the API, and the page
 * with the backlink. The tier notice says before sending which key the answers lead to: free only
 * for open source that earns nothing but donations. Every request is decided by hand.
 */
export function KeyRequestForm({ onFiled }: { onFiled: () => void }) {
  const t = useTranslations('developers.form');
  const tErr = useTranslations('developers.error');
  const tPerm = useTranslations('developers.permissions');
  const locale = useLocale();

  const [projectName, setProjectName] = useState('');
  const [website, setWebsite] = useState('');
  const [kind, setKind] = useState<ProjectKind | ''>('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [languages, setLanguages] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<SourceModel | null>(null);
  const [repository, setRepository] = useState('');
  const [license, setLicense] = useState('');
  const [revenue, setRevenue] = useState<RevenueModel[]>([]);
  const [permissions, setPermissions] = useState<ApiPermission[]>([]);
  const [endpoints, setEndpoints] = useState('');
  const [volume, setVolume] = useState<RequestVolume>('under-1k');
  const [parks, setParks] = useState('');
  const [serverSide, setServerSide] = useState(false);
  const [caching, setCaching] = useState('');
  const [attributionUrl, setAttributionUrl] = useState('');
  const [message, setMessage] = useState('');
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = requestTier({ source, revenue });
  const backlink = normalizeUrl(attributionUrl);
  const repo = normalizeUrl(repository);
  const complete =
    projectName.trim() !== '' &&
    kind !== '' &&
    platforms.length > 0 &&
    description.trim().length >= L.descriptionMin &&
    source !== null &&
    (source !== 'open-source' || repo !== null) &&
    revenue.length > 0 &&
    permissions.length > 0 &&
    backlink !== null &&
    serverSide &&
    terms;

  const togglePermission = (permission: ApiPermission, checked: boolean) =>
    setPermissions((current) =>
      sortPermissions(
        checked ? [...current, permission] : current.filter((value) => value !== permission)
      )
    );

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!complete || busy || source === null || !backlink) return;
    setBusy(true);
    setError(null);
    const input: KeyRequestInput = {
      projectName: projectName.trim(),
      ...(normalizeUrl(website) && { website: normalizeUrl(website) as string }),
      kind,
      platforms,
      ...(languages.trim() && { languages: languages.trim() }),
      description: description.trim(),
      source,
      ...(source === 'open-source' && repo && { repository: repo }),
      ...(source === 'open-source' && license.trim() && { license: license.trim() }),
      revenue,
      permissions,
      ...(endpoints.trim() && { endpoints: endpoints.trim() }),
      volume,
      ...(parks.trim() && { parks: parks.trim() }),
      serverSide,
      ...(caching.trim() && { caching: caching.trim() }),
      attributionUrl: backlink,
      ...(message.trim() && { message: message.trim() }),
      locale,
      terms: true,
    };
    try {
      await createKeyRequest(input);
      onFiled();
    } catch (err) {
      const code = err instanceof SessionApiError ? err.code : 'network';
      setError(tErr.has(code) ? tErr(code) : tErr('generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      <Card>
        <CardContent className="space-y-8">
          <FormStep n={1} title={t('project')}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field field="projectName" label={t('projectName')} hint={t('projectNameHint')}>
                  <Input
                    id={fid('projectName')}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    maxLength={L.projectName}
                    required
                  />
                </Field>
                <Field field="kind" label={t('kind')}>
                  <NativeSelect
                    id={fid('kind')}
                    value={kind}
                    onChange={(e) => setKind(e.target.value as ProjectKind)}
                    required
                  >
                    <option value="" disabled>
                      {t('kindPlaceholder')}
                    </option>
                    {PROJECT_KINDS.map((value) => (
                      <option key={value} value={value}>
                        {t(`kinds.${value}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-sm font-medium">{t('platforms')}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PLATFORMS.map((value) => (
                    <CheckRow
                      key={value}
                      checked={platforms.includes(value)}
                      onChange={(checked) =>
                        setPlatforms((current) =>
                          checked ? [...current, value] : current.filter((p) => p !== value)
                        )
                      }
                    >
                      {t(`platformNames.${value}`)}
                    </CheckRow>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field field="website" label={t('website')} optional={t('optional')}>
                  <Input
                    id={fid('website')}
                    type="url"
                    inputMode="url"
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={L.url}
                  />
                </Field>
                <Field
                  field="languages"
                  label={t('languages')}
                  optional={t('optional')}
                  hint={t('languagesHint')}
                >
                  <Input
                    id={fid('languages')}
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    maxLength={L.languages}
                  />
                </Field>
              </div>
              <Field
                field="description"
                label={t('description')}
                hint={t('descriptionHint', { min: L.descriptionMin })}
              >
                <Textarea
                  id={fid('description')}
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={L.descriptionMin}
                  maxLength={L.description}
                  required
                />
              </Field>
            </div>
          </FormStep>

          <FormStep n={2} title={t('sourceAndMoney')}>
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="mb-1.5 text-sm font-medium">{t('source')}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SOURCE_MODELS.map((value) => (
                    <CheckRow
                      key={value}
                      type="radio"
                      name="source"
                      checked={source === value}
                      onChange={() => setSource(value)}
                    >
                      {t(`sources.${value}`)}
                    </CheckRow>
                  ))}
                </div>
              </fieldset>
              {source === 'open-source' && (
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                  <Field field="repository" label={t('repository')}>
                    <Input
                      id={fid('repository')}
                      type="url"
                      inputMode="url"
                      placeholder="https://github.com/…"
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      maxLength={L.url}
                      required
                    />
                  </Field>
                  <Field field="license" label={t('license')} optional={t('optional')}>
                    <Input
                      id={fid('license')}
                      placeholder="MIT"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      maxLength={L.license}
                    />
                  </Field>
                </div>
              )}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">{t('money')}</legend>
                <p className="text-muted-foreground text-xs">{t('moneyHint')}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {REVENUE_MODELS.map((value) => (
                    <CheckRow
                      key={value}
                      checked={revenue.includes(value)}
                      onChange={(checked) =>
                        setRevenue((current) => toggleRevenue(current, value, checked))
                      }
                    >
                      {t(`revenue.${value}`)}
                    </CheckRow>
                  ))}
                </div>
              </fieldset>
              {source !== null && revenue.length > 0 && (
                <p
                  role="status"
                  className={cn(
                    'flex gap-2.5 rounded-lg border p-3 text-sm leading-relaxed',
                    tier === 'free'
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-amber-500/40 bg-amber-500/10'
                  )}
                >
                  {tier === 'free' ? (
                    <BadgeCheck
                      className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      aria-hidden
                    />
                  ) : (
                    <CircleDollarSign
                      className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                  )}
                  {tier === 'free' ? t('tierFree') : t('tierPaid')}
                </p>
              )}
            </div>
          </FormStep>

          <FormStep n={3} title={t('needs')}>
            <div className="space-y-5">
              <p className="text-muted-foreground text-xs">{t('permissionsHint')}</p>
              {API_PERMISSION_GROUP_IDS.map((group) => (
                <fieldset key={group} className="space-y-2">
                  <legend className="text-sm font-semibold">{tPerm(`groups.${group}`)}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {API_PERMISSION_GROUPS[group].map((permission) => {
                      const keyless = KEYLESS_PERMISSIONS.includes(permission);
                      return (
                        <CheckRow
                          key={permission}
                          checked={keyless || permissions.includes(permission)}
                          disabled={keyless}
                          onChange={(checked) => togglePermission(permission, checked)}
                          detail={tPerm(`items.${permission}.description`)}
                        >
                          {tPerm(`items.${permission}.title`)}
                        </CheckRow>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field field="volume" label={t('volume')}>
                  <NativeSelect
                    id={fid('volume')}
                    value={volume}
                    onChange={(e) => setVolume(e.target.value as RequestVolume)}
                  >
                    {REQUEST_VOLUMES.map((value) => (
                      <option key={value} value={value}>
                        {t(`volumes.${value}`)}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field
                  field="parks"
                  label={t('parks')}
                  optional={t('optional')}
                  hint={t('parksHint')}
                >
                  <Input
                    id={fid('parks')}
                    value={parks}
                    onChange={(e) => setParks(e.target.value)}
                    maxLength={L.parks}
                  />
                </Field>
              </div>
              <Field
                field="endpoints"
                label={t('endpoints')}
                optional={t('optional')}
                hint={t('endpointsHint')}
              >
                <Textarea
                  id={fid('endpoints')}
                  rows={3}
                  placeholder="GET /v1/parks/{…}/{park}/calendar"
                  value={endpoints}
                  onChange={(e) => setEndpoints(e.target.value)}
                  maxLength={L.endpoints}
                />
              </Field>
            </div>
          </FormStep>

          <FormStep n={4} title={t('integration')}>
            <div className="space-y-4">
              <CheckRow checked={serverSide} onChange={setServerSide} detail={t('serverSideHint')}>
                {t('serverSide')}
              </CheckRow>
              <Field
                field="caching"
                label={t('caching')}
                optional={t('optional')}
                hint={t('cachingHint')}
              >
                <Textarea
                  id={fid('caching')}
                  rows={2}
                  value={caching}
                  onChange={(e) => setCaching(e.target.value)}
                  maxLength={L.caching}
                />
              </Field>
              <Field
                field="attributionUrl"
                label={t('attributionUrl')}
                hint={t.rich('attributionUrlHint', {
                  link: (chunks) => (
                    <Link
                      href={`${DEVELOPERS_PATH}#${ATTRIBUTION_ANCHOR}`}
                      prefetch={false}
                      className="text-primary underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              >
                <Input
                  id={fid('attributionUrl')}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  value={attributionUrl}
                  onChange={(e) => setAttributionUrl(e.target.value)}
                  maxLength={L.url}
                  required
                />
              </Field>
              <Field field="message" label={t('message')} optional={t('optional')}>
                <Textarea
                  id={fid('message')}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={L.message}
                />
              </Field>
              <CheckRow checked={terms} onChange={setTerms}>
                {t.rich('terms', {
                  link: (chunks) => (
                    <Link
                      href={`/impressum#${DATA_TERMS_ANCHOR}`}
                      prefetch={false}
                      className="text-primary underline underline-offset-2"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </CheckRow>
            </div>
          </FormStep>

          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 border-t pt-6">
            <Button type="submit" size="lg" disabled={!complete || busy} className="gap-2">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {busy ? t('submitting') : t('submit')}
            </Button>
            {!complete && !busy && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="size-3.5 shrink-0" />
                {t('requirements')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
