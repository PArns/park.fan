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

function reportWebVital(metric: {
  name: string;
  value: number;
  rating: string;
  attribution?: WebVitalAttribution;
}) {
  if (metric.name !== 'INP') return;
  const path = stripLocale(window.location.pathname);
  const a = metric.attribution;
  trackEvent('web-vital-inp', {
    value: Math.round(metric.value),
    rating: metric.rating,
    target: a?.interactionTarget?.slice(0, 120),
    type: a?.interactionType,
    inputDelay: Math.round(a?.inputDelay ?? 0),
    processing: Math.round(a?.processingDuration ?? 0),
    presentation: Math.round(a?.presentationDelay ?? 0),
    loadState: a?.loadState,
    path,
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    // Passive observer; INP reports its final value on page-hide by default, matching CrUX.
    onINP(reportWebVital);
  }, []);
  return null;
}
