'use client';

import { useEffect } from 'react';
import { onINP } from 'web-vitals/attribution';
import { trackEvent } from '@/lib/analytics/umami';

/**
 * Reports INP **with attribution** to Umami so the slow interaction behind a poor INP can be
 * identified in the field (Google only gives the aggregate). INP is the current problem child
 * (>200ms mobile on big park pages); `interactionTarget` is the CSS selector of the element and
 * the delay breakdown (input → processing → presentation) tells us which phase to fix.
 *
 * Scope note: only INP is reported. The other web vitals (LCP/CLS/TTFB/FCP) were removed to stay
 * within Umami's event budget — they fired on every pageview (~5× pageviews) and were diagnostic
 * "context" rather than something we act on. Re-add or sample them if that budget grows.
 *
 * Budget note: this used to send nine properties on every sample, and Umami bills each property as
 * a separate event — ten billed rows per pageview with an interaction, which made it the single
 * largest line in the bill. Two cuts, both aligned with what this is actually for:
 *   - Only `needs-improvement` and `poor` samples are sent. A `good` INP is not something we act
 *     on, and the field distribution is already available from CrUX.
 *   - The three delay numbers collapse into `phase`, the one that dominated. That is the whole
 *     decision the breakdown drives (input → yield to the main thread, processing → cheaper
 *     handler, presentation → cheaper re-render); the exact milliseconds never changed it.
 * `rating` went too — it is a threshold on `value` — as did `type` and `loadState`.
 *
 * IMPORTANT: this imports the `web-vitals/attribution` build **directly** rather than going
 * through Next's `useReportWebVitals`. In Next 16, `useReportWebVitals` imports the plain
 * (non-attribution) `web-vitals` build and `experimental.webVitalsAttribution` does NOT wire
 * attribution into it (the flag's env vars are defined but never consumed, and there's no
 * module alias) — so `metric.attribution` arrived `undefined`. Importing `web-vitals/attribution`
 * ourselves makes the breakdown bundler-independent.
 *
 * The callback is module-scoped (stable reference) so it isn't re-created on every render.
 */
const stripLocale = (p: string) => p.replace(/^\/(en|de|fr|it|nl|es)(?=\/|$)/, '') || '/';

interface WebVitalAttribution {
  interactionTarget?: string;
  interactionType?: string;
  inputDelay?: number;
  processingDuration?: number;
  presentationDelay?: number;
  loadState?: string;
}

/** The phase that contributed most to this interaction — the part worth fixing. */
function dominantPhase(a: WebVitalAttribution | undefined): 'input' | 'processing' | 'presentation' {
  const input = a?.inputDelay ?? 0;
  const processing = a?.processingDuration ?? 0;
  const presentation = a?.presentationDelay ?? 0;
  if (input >= processing && input >= presentation) return 'input';
  return processing >= presentation ? 'processing' : 'presentation';
}

function reportWebVital(metric: {
  name: string;
  value: number;
  rating: string;
  attribution?: WebVitalAttribution;
}) {
  if (metric.name !== 'INP') return;
  // A good INP is not actionable, and reporting it cost five billed rows to say "nothing to do".
  if (metric.rating === 'good') return;

  trackEvent('web-vital-inp', {
    value: Math.round(metric.value),
    target: metric.attribution?.interactionTarget?.slice(0, 120),
    phase: dominantPhase(metric.attribution),
    path: stripLocale(window.location.pathname),
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    // Passive observer; INP reports its final value on page-hide by default, matching CrUX.
    onINP(reportWebVital);
  }, []);
  return null;
}
