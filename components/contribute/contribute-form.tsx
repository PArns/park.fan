'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MAX_FILE_SIZE } from '@/lib/contribute/config';
import type { AssignedEntity, UploadedBlob } from '@/lib/contribute/types';
import { PhotoDropzone, type PendingImage } from './photo-dropzone';
import { EntityPicker } from './entity-picker';
import { TurnstileWidget } from './turnstile-widget';
import { compressImage } from './compress';

interface ContributeFormProps {
  /** Optional pre-assigned entity (e.g. when the form is embedded on a park page). */
  initialEntity?: AssignedEntity | null;
}

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting'; done: number; total: number }
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
  const router = useRouter();

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

  const fail = (code: string) => setSubmit({ status: 'error', code });
  const succeed = (count: number) => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    // Navigate to the dedicated thank-you page (keeps the submitting spinner until then).
    router.push(`/contribute/thanks?count=${count}`);
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
        error?: string;
      };
      if (!startRes.ok || !start.ok || !start.ticket) {
        return fail(start.error ?? 'generic');
      }
      const { ticket } = start;

      // 2) Proxy each photo through our server (one request per file, each < 4.5 MB).
      //    Large originals are downscaled client-side so they fit the limit.
      const blobs: UploadedBlob[] = [];
      for (let i = 0; i < images.length; i++) {
        const file = await compressImage(images[i].file, MAX_FILE_SIZE - 256 * 1024);
        const form = new FormData();
        form.append('ticket', ticket);
        form.append('file', file, file.name);
        const res = await fetch('/api/contribute/file', { method: 'POST', body: form });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          blob?: UploadedBlob;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.blob) return fail(data.error ?? 'generic');
        blobs.push(data.blob);
        setSubmit({ status: 'submitting', done: i + 1, total: images.length });
      }

      // 3) Record the moderation-queue entry.
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
    } catch {
      fail('network');
    }
  };

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
