'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Loader2, MailCheck, Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input, NativeSelect, Textarea } from '@/components/ui/input';
import { FormStep } from '@/components/common/form-step';
import { TurnstileWidget, type TurnstileHandle } from '@/components/common/turnstile-widget';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';
import { DATA_TERMS_ANCHOR } from '@/lib/agents/licensing';
import { cn } from '@/lib/utils';
import { API_SCOPES, type ApiScope } from '@/lib/developers/scopes';
import {
  KEY_REQUEST_LIMITS,
  KEY_REQUEST_PATH,
  PROJECT_KINDS,
  REQUEST_VOLUMES,
  REVENUE_MODELS,
  SOURCE_MODELS,
  isCommercialRequest,
  toggleRevenue,
  type ProjectKind,
  type RequestVolume,
  type RevenueModel,
  type SourceModel,
} from '@/lib/developers/key-request';

const L = KEY_REQUEST_LIMITS;

/** A field's element id, prefixed so it cannot collide with the page's section anchors. */
const fid = (field: string) => `key-request-${field}`;

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; code: string }
  | { status: 'done'; email: string };

/** A labelled field: label, the control, an optional hint, and the field's error when it has one. */
function Field({
  id,
  label,
  optional,
  hint,
  invalid,
  children,
}: {
  id: string;
  label: string;
  optional?: string;
  hint?: string;
  invalid?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="text-muted-foreground font-normal"> ({optional})</span>}
      </label>
      {children}
      {invalid ? (
        <p id={`${id}-hint`} className="text-destructive text-xs" role="alert">
          {invalid}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/** A tick box drawn as a bordered row, tinted while ticked, with an optional second line. */
function CheckRow({
  checked,
  onChange,
  disabled,
  type = 'checkbox',
  name,
  children,
  detail,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  type?: 'checkbox' | 'radio';
  name?: string;
  children: ReactNode;
  detail?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors',
        checked ? 'border-primary/40 bg-primary/[5%]' : 'border-border'
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
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
 * The developer portal's key request: who asks, what the project is and how it earns money, which
 * scopes it needs. Posts to `KEY_REQUEST_PATH` behind Turnstile; the route validates with the same
 * schema (`lib/developers/key-request.ts`) and names the fields it refused, which this form marks.
 * A revenue model that makes the use commercial shows the agreement notice before sending.
 */
export function KeyRequestForm({ locale }: { locale: Locale }) {
  const t = useTranslations('developers.form');
  const tErr = useTranslations('developers.error');
  const tScopes = useTranslations('developers.scopes');
  const turnstile = useRef<TurnstileHandle>(null);
  const top = useRef<HTMLDivElement>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [projectName, setProjectName] = useState('');
  const [website, setWebsite] = useState('');
  const [kind, setKind] = useState<ProjectKind | ''>('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState<SourceModel | null>(null);
  const [repository, setRepository] = useState('');
  const [revenue, setRevenue] = useState<RevenueModel[]>([]);
  const [scopes, setScopes] = useState<ApiScope[]>([]);
  const [volume, setVolume] = useState<RequestVolume>('under-1k');
  const [parks, setParks] = useState('');
  const [message, setMessage] = useState('');
  const [terms, setTerms] = useState(false);
  const [token, setToken] = useState('');
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });

  const submitting = submit.status === 'submitting';
  const commercial = isCommercialRequest(revenue);
  const complete =
    name.trim() !== '' &&
    email.includes('@') &&
    projectName.trim() !== '' &&
    kind !== '' &&
    description.trim().length >= L.descriptionMin &&
    source !== null &&
    (source !== 'open-source' || repository.trim() !== '') &&
    revenue.length > 0 &&
    scopes.length > 0 &&
    terms;
  const canSubmit = complete && token !== '' && !submitting;

  /** The field's error text when the route refused it. */
  const fieldError = (field: string) => (invalid.has(field) ? t('fieldInvalid') : undefined);
  /** Props that tie a field's control to its hint and mark it invalid. */
  const described = (field: string) => ({
    id: fid(field),
    'aria-describedby': `${fid(field)}-hint`,
    'aria-invalid': invalid.has(field) || undefined,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmit({ status: 'submitting' });
    setInvalid(new Set());

    try {
      const res = await fetch(KEY_REQUEST_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turnstileToken: token,
          locale,
          name,
          email,
          organisation,
          projectName,
          website,
          kind,
          source,
          repository: source === 'open-source' ? repository : '',
          revenue,
          scopes,
          volume,
          parks,
          description,
          message,
          terms: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fields?: string[];
      };
      if (res.ok && data.ok) {
        setSubmit({ status: 'done', email: email.trim() });
        top.current?.scrollIntoView({ block: 'start' });
        return;
      }
      if (data.fields) setInvalid(new Set(data.fields));
      setSubmit({ status: 'error', code: data.error ?? 'generic' });
    } catch {
      setSubmit({ status: 'error', code: 'network' });
    }
    // A token is good for one attempt; the next needs a fresh one.
    setToken('');
    turnstile.current?.reset();
  };

  if (submit.status === 'done') {
    return (
      <div ref={top} className="scroll-mt-24">
        <Card>
          <CardContent className="flex gap-4">
            <MailCheck className="text-primary mt-1 size-6 shrink-0" aria-hidden />
            <div className="space-y-2" role="status">
              <h2 className="text-lg font-semibold">{t('doneTitle')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('doneBody', { email: submit.email })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={top} className="scroll-mt-24">
      <form onSubmit={handleSubmit} noValidate>
        <Card>
          <CardContent className="space-y-8">
            <FormStep n={1} title={t('you')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={fid('name')} label={t('name')} invalid={fieldError('name')}>
                  <Input
                    {...described('name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={L.name}
                    autoComplete="name"
                    required
                    disabled={submitting}
                  />
                </Field>
                <Field
                  id={fid('email')}
                  label={t('email')}
                  hint={t('emailHint')}
                  invalid={fieldError('email')}
                >
                  <Input
                    {...described('email')}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={L.email}
                    autoComplete="email"
                    required
                    disabled={submitting}
                  />
                </Field>
                <Field
                  id={fid('organisation')}
                  label={t('organisation')}
                  optional={t('optional')}
                  invalid={fieldError('organisation')}
                >
                  <Input
                    {...described('organisation')}
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                    maxLength={L.organisation}
                    autoComplete="organization"
                    disabled={submitting}
                  />
                </Field>
              </div>
            </FormStep>

            <FormStep n={2} title={t('project')}>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id={fid('projectName')}
                    label={t('projectName')}
                    hint={t('projectNameHint')}
                    invalid={fieldError('projectName')}
                  >
                    <Input
                      {...described('projectName')}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      maxLength={L.projectName}
                      required
                      disabled={submitting}
                    />
                  </Field>
                  <Field id={fid('kind')} label={t('kind')} invalid={fieldError('kind')}>
                    <NativeSelect
                      {...described('kind')}
                      value={kind}
                      onChange={(e) => setKind(e.target.value as ProjectKind)}
                      required
                      disabled={submitting}
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
                <Field
                  id={fid('website')}
                  label={t('website')}
                  optional={t('optional')}
                  invalid={fieldError('website')}
                >
                  <Input
                    {...described('website')}
                    type="url"
                    inputMode="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    maxLength={L.url}
                    placeholder="https://"
                    disabled={submitting}
                  />
                </Field>
                <Field
                  id={fid('description')}
                  label={t('description')}
                  hint={t('descriptionHint', { min: L.descriptionMin })}
                  invalid={fieldError('description')}
                >
                  <Textarea
                    {...described('description')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    minLength={L.descriptionMin}
                    maxLength={L.description}
                    required
                    disabled={submitting}
                  />
                </Field>
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
                        disabled={submitting}
                      >
                        {t(`sources.${value}`)}
                      </CheckRow>
                    ))}
                  </div>
                </fieldset>
                {source === 'open-source' && (
                  <Field
                    id={fid('repository')}
                    label={t('repository')}
                    invalid={fieldError('repository')}
                  >
                    <Input
                      {...described('repository')}
                      type="url"
                      inputMode="url"
                      value={repository}
                      onChange={(e) => setRepository(e.target.value)}
                      maxLength={L.url}
                      placeholder="https://github.com/…"
                      required
                      disabled={submitting}
                    />
                  </Field>
                )}
              </div>
            </FormStep>

            <FormStep n={3} title={t('money')}>
              <fieldset className="space-y-2" aria-describedby="revenue-hint">
                <legend id="revenue-hint" className="text-muted-foreground mb-2 text-sm">
                  {t('moneyHint')}
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {REVENUE_MODELS.map((value) => (
                    <CheckRow
                      key={value}
                      checked={revenue.includes(value)}
                      onChange={(checked) =>
                        setRevenue((current) => toggleRevenue(current, value, checked))
                      }
                      disabled={submitting}
                    >
                      {t(`revenue.${value}`)}
                    </CheckRow>
                  ))}
                </div>
                {commercial && (
                  <p
                    className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm leading-relaxed"
                    role="status"
                  >
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                    {t('commercialNotice')}
                  </p>
                )}
              </fieldset>
            </FormStep>

            <FormStep n={4} title={t('needs')}>
              <div className="space-y-4">
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{t('scopes')}</legend>
                  <p className="text-muted-foreground text-xs">{t('scopesHint')}</p>
                  <div className="grid gap-2">
                    {API_SCOPES.map((scope) => (
                      <CheckRow
                        key={scope}
                        checked={scopes.includes(scope)}
                        onChange={(checked) =>
                          setScopes((current) =>
                            checked
                              ? API_SCOPES.filter((s) => s === scope || current.includes(s))
                              : current.filter((s) => s !== scope)
                          )
                        }
                        detail={tScopes(`${scope}.description`)}
                        disabled={submitting}
                      >
                        {tScopes(`${scope}.title`)}
                      </CheckRow>
                    ))}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id={fid('volume')} label={t('volume')} invalid={fieldError('volume')}>
                    <NativeSelect
                      {...described('volume')}
                      value={volume}
                      onChange={(e) => setVolume(e.target.value as RequestVolume)}
                      disabled={submitting}
                    >
                      {REQUEST_VOLUMES.map((value) => (
                        <option key={value} value={value}>
                          {t(`volumes.${value}`)}
                        </option>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field
                    id={fid('parks')}
                    label={t('parks')}
                    optional={t('optional')}
                    hint={t('parksHint')}
                    invalid={fieldError('parks')}
                  >
                    <Input
                      {...described('parks')}
                      value={parks}
                      onChange={(e) => setParks(e.target.value)}
                      maxLength={L.parks}
                      disabled={submitting}
                    />
                  </Field>
                </div>
                <Field
                  id={fid('message')}
                  label={t('message')}
                  optional={t('optional')}
                  invalid={fieldError('message')}
                >
                  <Textarea
                    {...described('message')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    maxLength={L.message}
                    disabled={submitting}
                  />
                </Field>
              </div>
            </FormStep>

            <FormStep n={5} title={t('send')}>
              <div className="space-y-4">
                <CheckRow checked={terms} onChange={setTerms} disabled={submitting}>
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
                <TurnstileWidget
                  ref={turnstile}
                  action={TURNSTILE_ACTIONS.developerKeyRequest}
                  onVerify={setToken}
                  onExpire={() => setToken('')}
                />
              </div>
            </FormStep>

            {submit.status === 'error' && (
              <p className="text-destructive text-sm" role="alert">
                {tErr.has(submit.code) ? tErr(submit.code) : tErr('generic')}
              </p>
            )}

            <div className="flex flex-col gap-2 border-t pt-6">
              <Button type="submit" size="lg" disabled={!canSubmit} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('submitting')}
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {t('submit')}
                  </>
                )}
              </Button>
              {!complete && !submitting && (
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  {t('requirements')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
