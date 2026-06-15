'use client';

import { useEffect } from 'react';
import { onINP, onLCP, onCLS, onTTFB, onFCP } from 'web-vitals/attribution';
import { trackEvent } from '@/lib/analytics/umami';

/**
 * Reports Core Web Vitals **with attribution** to Umami so the slow interaction behind a poor
 * INP can be identified in the field (Google only gives the aggregate). INP is the current
 * problem child (>200ms mobile on big park pages); LCP/CLS are reported too for context.
 *
 * TTFB + FCP are also reported: with the streamed homepage shell, TTFB is the server time
 * before the first byte and FCP splits that server wait (timeToFirstByte) from the client
 * paint cost (firstByteToFCP) — the two numbers that show whether a "slow load" is a server
 * or a client problem. CLS attribution (`largestShiftTarget`) surfaces the element that
 * shifts most, so the Suspense skeleton fit can be validated in the field.
 *
 * IMPORTANT: this imports the `web-vitals/attribution` build **directly** rather than going
 * through Next's `useReportWebVitals`. In Next 16, `useReportWebVitals` imports the plain
 * (non-attribution) `web-vitals` build and `experimental.webVitalsAttribution` does NOT wire
 * attribution into it (the flag's env vars are defined but never consumed, and there's no
 * module alias) — so `metric.attribution` arrived `undefined` and every phase reported as 0.
 * Importing `web-vitals/attribution` ourselves makes the breakdown bundler-independent.
 * For INP, `interactionTarget` is the CSS selector of the element and the delay breakdown
 * (input → processing → presentation) tells us which phase to fix.
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
  element?: string;
  largestShiftTarget?: string;
  // TTFB phase breakdown (web-vitals): waiting is the server/redirect time before the byte.
  waitingDuration?: number;
  cacheDuration?: number;
  dnsDuration?: number;
  connectionDuration?: number;
  requestDuration?: number;
  // FCP breakdown — splits the server wait (TTFB) from the client-side paint cost.
  timeToFirstByte?: number;
  firstByteToFCP?: number;
}

function reportWebVital(metric: {
  name: string;
  value: number;
  rating: string;
  attribution?: WebVitalAttribution;
}) {
  const path = stripLocale(window.location.pathname);
  const a = metric.attribution;
  switch (metric.name) {
    case 'INP':
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
      break;
    case 'LCP':
      trackEvent('web-vital-lcp', {
        value: Math.round(metric.value),
        rating: metric.rating,
        element: a?.element?.slice(0, 120),
        path,
      });
      break;
    case 'CLS':
      trackEvent('web-vital-cls', {
        value: Math.round(metric.value * 1000) / 1000,
        rating: metric.rating,
        element: a?.largestShiftTarget?.slice(0, 120),
        path,
      });
      break;
    case 'TTFB':
      trackEvent('web-vital-ttfb', {
        value: Math.round(metric.value),
        rating: metric.rating,
        waiting: Math.round(a?.waitingDuration ?? 0),
        dns: Math.round(a?.dnsDuration ?? 0),
        connection: Math.round(a?.connectionDuration ?? 0),
        request: Math.round(a?.requestDuration ?? 0),
        path,
      });
      break;
    case 'FCP':
      trackEvent('web-vital-fcp', {
        value: Math.round(metric.value),
        rating: metric.rating,
        ttfb: Math.round(a?.timeToFirstByte ?? 0),
        firstByteToFcp: Math.round(a?.firstByteToFCP ?? 0),
        loadState: a?.loadState,
        path,
      });
      break;
  }
}

export function WebVitalsReporter() {
  useEffect(() => {
    // Each onX registers a passive observer and fires reportWebVital with the metric (incl.
    // attribution). INP/LCP/CLS report their final value on page-hide by default, matching CrUX.
    onINP(reportWebVital);
    onLCP(reportWebVital);
    onCLS(reportWebVital);
    onTTFB(reportWebVital);
    onFCP(reportWebVital);
  }, []);
  return null;
}
