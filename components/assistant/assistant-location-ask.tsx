'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocateFixed } from 'lucide-react';
import { useGeolocation } from '@/lib/contexts/geolocation-context';

type Step = 'ask' | 'locating' | 'declined';

/**
 * Parky's question for the visitor's position, answered in the chat: nothing is read until the
 * visitor presses „Standort teilen". The read goes through the site's own geolocation, so the same
 * yes also puts the in-park markers and the compass on the park's page. The position is handed on
 * once, for the next question, and kept nowhere by Parky.
 */
export function AssistantLocationAsk({
  onShare,
}: {
  onShare: (position: { lat: number; lng: number }) => void;
}) {
  const t = useTranslations('assistant');
  const geo = useGeolocation();
  const [step, setStep] = useState<Step>('ask');

  // The fix arrives some time after the press; the parent hides this card once it is handed on.
  useEffect(() => {
    if (step === 'locating' && geo.position) onShare(geo.position);
  }, [step, geo.position, onShare]);

  const denied = step === 'locating' && geo.permissionDenied;
  return (
    <div className="border-primary/30 bg-primary/5 mt-2 rounded-xl border p-3 text-xs">
      <p className="flex items-center gap-1.5 font-medium">
        <LocateFixed className="text-primary size-4" />
        {denied
          ? t('locationDenied')
          : step === 'declined'
            ? t('locationDeclined')
            : t('locationAsk')}
      </p>
      {step === 'ask' && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setStep('locating');
              geo.refresh();
            }}
            className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 font-medium"
          >
            {t('locationShare')}
          </button>
          <button
            type="button"
            onClick={() => setStep('declined')}
            className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5"
          >
            {t('locationNo')}
          </button>
        </div>
      )}
      {step === 'locating' && !denied && (
        <p className="text-muted-foreground mt-1">{t('locationLocating')}</p>
      )}
    </div>
  );
}
