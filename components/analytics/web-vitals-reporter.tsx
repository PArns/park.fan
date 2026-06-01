'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { trackEvent } from '@/lib/analytics/umami';

/**
 * Reports Core Web Vitals **with attribution** to Umami so the slow interaction behind a poor
 * INP can be identified in the field (Google only gives the aggregate). INP is the current
 * problem child (>200ms mobile on the homepage); LCP/CLS are reported too for context.
 *
 * Uses Next's built-in `useReportWebVitals` (Next bundles `web-vitals` — no extra dependency).
 * `metric.attribution` is populated because `experimental.webVitalsAttribution` is enabled in
 * `next.config.ts`. For INP, `interactionTarget` is the CSS selector of the element and the
 * delay breakdown (input → processing → presentation) tells us which phase to fix.
 *
 * The callback is module-scoped (stable reference) per the Next docs, so it isn't
 * re-registered on every render.
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
  }
}

export function WebVitalsReporter() {
  useReportWebVitals(reportWebVital);
  return null;
}
