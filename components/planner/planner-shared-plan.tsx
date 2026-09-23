'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarCheck, Loader2, MapPin, RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parsePlannerPayload, plannerStore } from '@/lib/planner/store';
import { adoptSharedPlan, tripIdFromHash } from '@/lib/planner/trip-share';
import { hasAnyPlan, type PlannerState } from '@/lib/planner/types';
import { plannerUi } from '@/lib/planner/ui-store';

/**
 * The page a shared-plan link opens: read somebody else's plan, then take a copy.
 *
 * The copy is the whole point (PAR-82, option A). The plan is written into THIS
 * browser's store and the sender's trip id is kept nowhere, so nothing here can
 * ever `PUT` to it: what the visitor changes afterwards is theirs, and the
 * sender's plan stays as it was. If this browser has push on, `adoptSharedPlan`
 * uploads the copy under this browser's own id.
 *
 * Nothing is written until the button is pressed. Opening a link must not
 * replace a plan the visitor already has, so when there is one the page says
 * so above the button.
 */

type Load =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'failed' }
  | { kind: 'empty' }
  | { kind: 'ready'; plan: PlannerState };

function subscribeHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function PlannerSharedPlan() {
  const t = useTranslations('planner');
  const locale = useLocale();

  // `undefined` on the server and in the hydration pass, where there is no
  // fragment to read; the real value arrives in the re-render right after.
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash,
    () => undefined
  );
  const tripId = hash === undefined ? undefined : tripIdFromHash(hash);

  const local = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot
  );

  const [loaded, setLoaded] = useState<{ id: string; attempt: number; load: Load } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The id that was taken over, not a boolean. A second link opened in the
  // same tab changes only the fragment, and a boolean would then show "the
  // plan is now in your planner" under a plan that is not.
  const [adoptedId, setAdoptedId] = useState<string | null>(null);
  const adopted = tripId !== undefined && tripId !== null && adoptedId === tripId;

  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    (async () => {
      let load: Load;
      try {
        const response = await fetch(`/api/trips/${tripId}`, { cache: 'no-store' });
        if (response.status === 404) {
          load = { kind: 'missing' };
        } else if (!response.ok) {
          load = { kind: 'failed' };
        } else {
          const plan = parsePlannerPayload(await response.text());
          load =
            plan === null
              ? { kind: 'failed' }
              : hasAnyPlan(plan)
                ? { kind: 'ready', plan }
                : { kind: 'empty' };
        }
      } catch {
        load = { kind: 'failed' };
      }
      if (!cancelled) setLoaded({ id: tripId, attempt, load });
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, attempt]);

  // A result belongs to the id and the attempt it was fetched for. Anything
  // else — a new fragment, or "try again" pressed — is loading again.
  const load: Load =
    tripId === undefined
      ? { kind: 'loading' }
      : tripId === null
        ? { kind: 'missing' }
        : loaded && loaded.id === tripId && loaded.attempt === attempt
          ? loaded.load
          : { kind: 'loading' };

  const parks =
    load.kind !== 'ready'
      ? []
      : Object.values(load.plan.parks)
          .map((park) => ({
            slug: park.slug,
            name: park.name,
            days: Object.values(park.days)
              .filter((day) => day.entries.length > 0)
              .sort((a, b) => a.date.localeCompare(b.date)),
          }))
          .filter((park) => park.days.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name, locale));

  const adopt = (id: string, plan: PlannerState) => {
    void adoptSharedPlan(plan);
    setAdoptedId(id);
  };

  if (load.kind === 'loading') {
    return (
      <p
        className="text-muted-foreground flex items-center gap-2 text-sm"
        data-shared-plan="loading"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        {t('shared.loading')}
      </p>
    );
  }

  if (load.kind !== 'ready') {
    const message =
      load.kind === 'missing'
        ? t('shared.missing')
        : load.kind === 'empty'
          ? t('shared.empty')
          : t('shared.failed');
    return (
      <div className="flex flex-col items-start gap-3" data-shared-plan={load.kind}>
        <p className="flex items-start gap-2 text-sm" role="alert">
          <TriangleAlert
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>{message}</span>
        </p>
        {load.kind === 'failed' && (
          <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            <RotateCw className="size-4" aria-hidden="true" />
            {t('shared.retry')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" data-shared-plan={adopted ? 'adopted' : 'ready'}>
      <div className="flex flex-col gap-3">
        {parks.map((park) => (
          <section key={park.slug}>
            <h2 className="text-muted-foreground flex items-center gap-1.5 pb-1 text-[11px] font-medium tracking-wide uppercase">
              <MapPin className="size-3" aria-hidden="true" />
              {park.name}
            </h2>
            <ul className="divide-border/60 divide-y">
              {park.days.map((day) => (
                <li key={day.date} className="flex items-center gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {new Date(`${day.date}T12:00:00Z`).toLocaleDateString(locale, {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    {t('summary.rides', { count: day.entries.length })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {adopted ? (
        <div className="flex flex-col items-start gap-3">
          <p className="flex items-start gap-2 text-sm" role="status">
            <CalendarCheck className="text-crowd-low mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{t('shared.adopted')}</span>
          </p>
          <Button onClick={() => plannerUi.requestOpen('shared-link')}>{t('shared.open')}</Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground text-sm">{t('shared.copyNote')}</p>
          {hasAnyPlan(local) && (
            <p className="text-sm font-medium" data-shared-plan-replaces="">
              {t('shared.replaces')}
            </p>
          )}
          <Button onClick={() => tripId && adopt(tripId, load.plan)}>{t('shared.adopt')}</Button>
        </div>
      )}
    </div>
  );
}
