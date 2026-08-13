'use client';

import { useEffect } from 'react';
import { onCLS, onINP } from 'web-vitals/attribution';
import { trackEvent } from '@/lib/analytics/umami';

/**
 * Reports INP **with attribution** to Umami so the slow interaction behind a poor INP can be
 * identified in the field (Google only gives the aggregate). INP is the current problem child
 * (>200ms mobile on big park pages); `interactionTarget` is the CSS selector of the element and
 * the delay breakdown (input → processing → presentation) tells us which phase to fix.
 *
 * Scope note: INP and — sampled, see CLS_SAMPLE_RATE below — CLS. LCP, TTFB and FCP stay out:
 * they fired on every pageview (~5× pageviews) for the Umami budget and were diagnostic
 * "context" rather than something we act on. CLS came back because the lab reports 0 while the
 * field reports 0.22, which no amount of local testing resolves; it is sampled at a tenth
 * precisely so it does not repeat the mistake that got the others removed.
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
  // A good INP is not actionable, and reporting it cost five billed rows to say "nothing to do".
  if (metric.rating === 'good') return;

  trackEvent('web-vital-inp', {
    value: Math.round(metric.value),
    target: metric.attribution?.interactionTarget?.slice(0, 120),
    phase: dominantPhase(metric.attribution),
    path: stripLocale(window.location.pathname),
  });
}

/**
 * How many of the non-good CLS samples are actually sent.
 *
 * This is a diagnostic, not a dashboard: the question it answers is "which element moves", and a
 * few dozen samples a day name the offenders just as well as all of them. The budget decides the
 * rate. CLS reports once per pageview, and CrUX puts this origin's p75 at 0.22 — so roughly half
 * of ~1.6 k daily pageviews would qualify. Unsampled that is ~800 samples × 5 billed rows ≈ 120 k
 * rows a month, which on its own exceeds the whole plan. At a tenth it is ~12 k.
 */
const CLS_SAMPLE_RATE = 0.1;

/**
 * Reports CLS **with attribution**, sampled, because the field and the lab disagree and only the
 * field is right.
 *
 * Lighthouse scores this site CLS 0 while CrUX reports 0.22 (Aug 2026). That gap is the whole
 * reason this exists: Lighthouse neither scrolls nor interacts nor carries a real visitor's
 * state, so every shift that needs one of those is invisible to it. Reproducing them by guessing
 * the condition took a day and turned up exactly one — the homepage hero growing by 54–148 px
 * when the nearby lookup lands on a phone, which no amount of lab testing would have shown.
 *
 * `largestShiftTarget` is the CSS selector of the element in the biggest shift of the session —
 * the one thing that turns "CLS is 0.22" into a file to open. `loadState` says whether it
 * happened while loading or long after, which is the difference between a late-arriving skeleton
 * and something that only moves once a visitor scrolls or clicks; that distinction is the open
 * question here, and it is why this one carries a fourth property where the INP event does not.
 *
 * Drop the sample rate or the whole event once the sources are known — it is here to find them,
 * not to watch them.
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

export function WebVitalsReporter() {
  useEffect(() => {
    // Passive observers; both report their final value on page-hide by default, matching CrUX.
    onINP(reportWebVital);
    onCLS(reportCls);
  }, []);
  return null;
}
