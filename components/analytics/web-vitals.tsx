'use client';

import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(metric.name, { value: Math.round(metric.value) as number });
    }
  });
  return null;
}
