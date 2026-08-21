'use client';

import { useState } from 'react';
import { Archive, Loader2, TriangleAlert, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInvalidateAdmin, adminKeys } from '../../_lib/api';
import { Chip } from '../../_ui/primitives';
import { Field, TextInput } from '../../_ui/controls';
import { useToast } from '../../_ui/toast';
import {
  RETIREMENT_KEYS,
  RETIRE_REASON_REQUIRED,
  retireAttraction,
  today,
  unretireAttraction,
} from '../../_ui/retirement';

interface AttractionStatusProps {
  attractionId: string;
  name: string;
  retiredAt: string | null;
  retiredReason: string | null;
  /** Stilllegen und Zurückholen verlangen `owner` — sonst nur die Anzeige. */
  canRetire: boolean;
}

function day(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Der Status einer Bahn — und der Schalter dafür.
 *
 * Er stand hier als vierte Kennzahl neben Slug und externer ID, also als
 * Tatsache, die man zur Kenntnis nimmt. Setzen ließ er sich nur in der
 * Arbeitsliste unter `/admin/retirement`, und die zeigt eine Bahn nur, solange
 * der Detector sie vorlegt: eine Bahn, deren Feed nie verstummt ist, taucht dort
 * gar nicht auf, und eine, die einmal als „kein Fall" abgehakt wurde, für Monate
 * nicht mehr. Für Maximus' Blitz Bahn im Toverland hieß das: keine Zeile,
 * nirgends, in der sich das Urteil ändern ließ.
 *
 * Deshalb steht die Entscheidung jetzt dort, wo man sie trifft — auf der Seite,
 * auf der man Ride-Profil, Bilder und Verlauf gerade angesehen hat. Die
 * Pflichtangaben sind dieselben wie in der Arbeitsliste, weil es dieselbe
 * Entscheidung ist.
 */
export function AttractionStatus({
  attractionId,
  name,
  retiredAt,
  retiredReason,
  canRetire,
}: AttractionStatusProps) {
  const toast = useToast();
  const invalidate = useInvalidateAdmin();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState('');

  const retired = retiredAt !== null;

  function done(title: string) {
    toast.push({ title, tone: 'success' });
    invalidate(adminKeys.attraction(attractionId), ...RETIREMENT_KEYS);
    setOpen(false);
    setBusy(false);
    setReason('');
  }

  async function retire() {
    if (!reason.trim()) {
      setError(RETIRE_REASON_REQUIRED);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await retireAttraction({ attractionId, retiredAt: date, reason: reason.trim() });
      done(`${name} stillgelegt`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stilllegen fehlgeschlagen');
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setError(null);
    try {
      await unretireAttraction(attractionId);
      done(`${name} zurückgeholt`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zurückholen fehlgeschlagen');
      setBusy(false);
    }
  }

  return (
    <div className="border-border/60 bg-card space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="text-muted-foreground text-[11px] tracking-wide uppercase">Status</p>
          <Chip tone={retired ? 'warning' : 'success'}>{retired ? 'stillgelegt' : 'aktiv'}</Chip>
        </div>

        {canRetire &&
          (retired ? (
            <Button size="sm" variant="ghost" onClick={restore} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              Auf aktiv setzen
            </Button>
          ) : (
            !open && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <Archive className="h-4 w-4" /> Stilllegen
              </Button>
            )
          ))}
      </div>

      {retired && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Stillgelegt am {day(retiredAt)}
            {retiredReason ? ` — ${retiredReason}` : ''}. Die Seite antwortet weiter, die Bahn
            taucht aber in keiner Liste mehr auf.
          </span>
        </p>
      )}

      {open && !retired && (
        <div className="border-border/60 space-y-3 border-t pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Stillgelegt am" hint="Der Tag, den eine Quelle nennt.">
              <TextInput
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </Field>
            <Field
              label="Grund und Quelle"
              hint="z. B. „Abriss angekündigt, parkfan.example/news/…“"
            >
              <TextInput value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={retire}
              disabled={busy}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Stilllegen
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              disabled={busy}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      )}

      {error && !open && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
