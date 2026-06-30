'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { upload } from '@vercel/blob/client';
import { CheckCircle2, Loader2, PartyPopper, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { AssignedEntity, UploadedBlob } from '@/lib/contribute/types';
import { PhotoDropzone, type PendingImage } from './photo-dropzone';
import { EntityPicker } from './entity-picker';
import { TurnstileWidget } from './turnstile-widget';

/** Sanitize a filename for use inside a Blob pathname (mirrors the server guard). */
function safeName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  return base.length > 0 ? base : 'image';
}

interface ContributeFormProps {
  /** Optional pre-assigned entity (e.g. when the form is embedded on a park page). */
  initialEntity?: AssignedEntity | null;
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting'; done: number; total: number }
  | { status: 'success'; count: number }
  | { status: 'error'; code: string };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold">
        <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full text-sm font-bold">
          {n}
        </span>
        {title}
      </h2>
      <div className="pl-9.5">{children}</div>
    </section>
  );
}

export function ContributeForm({ initialEntity = null }: ContributeFormProps) {
  const t = useTranslations('contribute.form');
  const tErr = useTranslations('contribute.error');
  const tOk = useTranslations('contribute.success');

  const [images, setImages] = useState<PendingImage[]>([]);
  const [entity, setEntity] = useState<AssignedEntity | null>(initialEntity);
  const [caption, setCaption] = useState('');
  const [credit, setCredit] = useState('');
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState('');
  const [submit, setSubmit] = useState<SubmitState>({ status: 'idle' });

  const submitting = submit.status === 'submitting';
  const canSubmit =
    images.length > 0 && entity !== null && consent && token.length > 0 && !submitting;

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setEntity(initialEntity);
    setCaption('');
    setCredit('');
    setConsent(false);
    setToken('');
    setSubmit({ status: 'idle' });
  };

  const fail = (code: string) => setSubmit({ status: 'error', code });
  const succeed = (count: number) => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setSubmit({ status: 'success', count });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !entity) return;
    setSubmit({ status: 'submitting', done: 0, total: images.length });

    try {
      // 1) Verify Turnstile + get a signed upload ticket.
      const startRes = await fetch('/api/contribute/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken: token, entity, caption, credit, consent: true }),
      });
      const start = (await startRes.json().catch(() => ({}))) as {
        ok?: boolean;
        ticket?: string;
        sid?: string;
        mode?: 'client' | 'server';
        error?: string;
      };
      if (!startRes.ok || !start.ok || !start.ticket || !start.sid) {
        return fail(start.error ?? 'generic');
      }
      const { ticket, sid, mode } = start;

      if (mode === 'client') {
        // 2a) Upload each photo straight to Vercel Blob (no 4.5 MB limit).
        const blobs: UploadedBlob[] = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          const result = await upload(
            `contributions/${sid}/${i}-${safeName(img.file.name)}`,
            img.file,
            {
              access: 'public',
              handleUploadUrl: '/api/contribute/upload',
              clientPayload: ticket,
              contentType: img.file.type,
              multipart: img.file.size > 8 * 1024 * 1024,
            }
          );
          blobs.push({
            url: result.url,
            pathname: result.pathname,
            originalName: img.file.name,
            contentType: img.file.type || result.contentType,
            size: img.file.size,
          });
          setSubmit({ status: 'submitting', done: i + 1, total: images.length });
        }
        // 3a) Record the moderation-queue entry.
        const finRes = await fetch('/api/contribute/finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket, blobs }),
        });
        const fin = (await finRes.json().catch(() => ({}))) as {
          ok?: boolean;
          count?: number;
          error?: string;
        };
        return finRes.ok && fin.ok
          ? succeed(fin.count ?? images.length)
          : fail(fin.error ?? 'generic');
      }

      // 2b) Server-upload fallback (offline dev, no Blob token; ≤4.5 MB).
      const form = new FormData();
      form.append('ticket', ticket);
      images.forEach((img) => form.append('files', img.file, img.file.name));
      const res = await fetch('/api/contribute', { method: 'POST', body: form });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        count?: number;
        error?: string;
      };
      return res.ok && data.ok
        ? succeed(data.count ?? images.length)
        : fail(data.error ?? 'generic');
    } catch {
      fail('network');
    }
  };

  if (submit.status === 'success') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="size-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{tOk('title')}</h2>
            <p className="text-muted-foreground max-w-md">
              {tOk('message', { count: submit.count })}
            </p>
          </div>
          <Button onClick={reset} className="gap-2">
            <Send className="size-4" />
            {tOk('again')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-8">
          <Step n={1} title={t('step1')}>
            <PhotoDropzone images={images} onChange={setImages} disabled={submitting} />
          </Step>

          <Step n={2} title={t('step2')}>
            <EntityPicker value={entity} onChange={setEntity} disabled={submitting} />
          </Step>

          <Step n={3} title={t('step3')}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="caption" className="text-sm font-medium">
                  {t('captionLabel')}
                </label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t('captionPlaceholder')}
                  maxLength={500}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="credit" className="text-sm font-medium">
                  {t('creditLabel')}
                </label>
                <Input
                  id="credit"
                  value={credit}
                  onChange={(e) => setCredit(e.target.value)}
                  placeholder={t('creditPlaceholder')}
                  maxLength={120}
                  disabled={submitting}
                />
              </div>
              <label
                className={cn(
                  'flex items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors',
                  consent ? 'border-primary/40 bg-primary/[5%]' : 'border-border'
                )}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  disabled={submitting}
                  className="accent-primary mt-0.5 size-4 shrink-0"
                />
                <span className="text-muted-foreground">
                  {t('consentLabel')}
                  {!consent && (
                    <span className="text-primary mt-1 block text-xs">{t('consentHint')}</span>
                  )}
                </span>
              </label>
            </div>
          </Step>

          <Step n={4} title={t('step4')}>
            <TurnstileWidget onVerify={setToken} onExpire={() => setToken('')} />
          </Step>

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
                  {submit.status === 'submitting' && submit.total > 1 && (
                    <span className="tabular-nums">
                      {' '}
                      {submit.done}/{submit.total}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {t('submit')}
                </>
              )}
            </Button>
            {!canSubmit && !submitting && (
              <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="size-3.5" />
                {t('requirements')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
