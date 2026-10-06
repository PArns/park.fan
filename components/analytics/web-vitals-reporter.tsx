'use client';

import { useEffect } from 'react';
import { onCLS, onINP } from 'web-vitals/attribution';
import { trackEvent } from '@/lib/analytics/umami';

/**
 * Reports INP and a sample of CLS to Umami with attribution, so the element behind a poor field
 * score can be found (`interactionTarget`, and `phase` for the part to fix). Only non-good samples
 * are sent, because Umami bills every property as an event; see docs/rules/umami-event-budget.md.
 * It imports `web-vitals/attribution` directly: Next's `useReportWebVitals` loads the plain build,
 * where `metric.attribution` is `undefined`.
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
function dominantPhase(
  a: WebVitalAttribution | undefined
): 'input' | 'processing' | 'presentation' {
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
  // A good INP is not actionable, and each sample is several billed rows.
  if (metric.rating === 'good') return;

  trackEvent('web-vital-inp', {
    value: Math.round(metric.value),
    target: metric.attribution?.interactionTarget?.slice(0, 120),
    phase: dominantPhase(metric.attribution),
    path: stripLocale(window.location.pathname),
  });
}

/**
 * Share of non-good CLS samples that are sent. A few dozen a day name the elements that move, and
 * unsampled they would exceed the whole Umami plan on their own.
 */
const CLS_SAMPLE_RATE = 0.1;

/**
 * Reports CLS with attribution, sampled, because the lab scores this site 0 while the field does
 * not: Lighthouse neither scrolls nor interacts. `largestShiftTarget` names the element, and
 * `loadState` tells a late skeleton from a shift after a scroll or click. Drop it once the sources
 * are known.
 */
function reportCls(metric: {
  name: string;
  value: number;
  rating: string;
  attribution?: { largestShiftTarget?: string; loadState?: string };
}) {
  // A good CLS needs no fixing, and CrUX already reports the distribution.
  if (metric.rating === 'good') return;
  if (Math.random() >= CLS_SAMPLE_RATE) return;

  trackEvent('web-vital-cls', {
    // Two decimals: the thresholds live at 0.1 and 0.25, so anything finer is noise.
    value: Math.round(metric.value * 100) / 100,
    target: metric.attribution?.largestShiftTarget?.slice(0, 120),
    loadState: metric.attribution?.loadState,
    path: stripLocale(window.location.pathname),
  });
}

/**
 * Sends non-good INP samples, and a tenth of non-good CLS samples, to Umami with the element and
 * phase behind them. Renders nothing.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Passive observers; both report their final value on page-hide by default, matching CrUX.
    onINP(reportWebVital);
    onCLS(reportCls);
  }, []);
  return null;
}
