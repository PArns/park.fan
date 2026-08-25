'use client';

import { useEffect, useRef } from 'react';

/**
 * The night shift: the jobs that turn a year of five-minute readings into the
 * numbers this page has been quoting, drawn on the hours they actually run at.
 *
 * It is here because it is the answer to "why can a site not just show this?".
 * A live wait time is one request. "Is 70 minutes a lot on a Tuesday" is a
 * percentile over every Tuesday on record, and it has to be standing by before
 * anyone asks — which is a scheduled job, an archive that was never thrown
 * away, and an order between the two that matters (rope drop reads yesterday's
 * rollup, so it cannot run before it).
 *
 * Motion follows the same split as everywhere else: CSS draws the finished
 * figure, GSAP only lifts the markers into place once, the first time it comes
 * into view. Nothing is hidden waiting for script — a blocked chunk or a
 * reduced-motion preference leaves the diagram complete and still.
 */

type Gsap = typeof import('gsap').gsap;

let gsapPromise: Promise<Gsap | null> | null = null;
function loadGsap(): Promise<Gsap | null> {
  gsapPromise ??= import('gsap').then((m) => m.gsap).catch(() => null);
  return gsapPromise;
}

export interface NightShiftJob {
  /** UTC hour the scheduler fires at, as a 24-hour number. */
  hour: number;
  /** UTC minute. */
  minute: number;
  /** Hour as a fraction of the window the track spans. */
  at: number;
  title: string;
  body: string;
}

/**
 * "02:00" is not how every language writes two in the morning. The times are
 * fixed points in UTC, so they are formatted from a UTC instant through `Intl`
 * — German and Dutch get 02:00, English gets 2:00 AM.
 */
function formatUtc(locale: string, hour: number, minute: number): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2026, 0, 1, hour, minute)));
}

export function NightShift({
  jobs,
  caption,
  locale,
}: {
  jobs: NightShiftJob[];
  caption: string;
  locale: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || playedRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || playedRef.current) return;
        playedRef.current = true;
        io.disconnect();

        loadGsap().then((gsap) => {
          if (cancelled || !gsap || !rootRef.current) return;
          const marks = Array.from(rootRef.current.querySelectorAll<HTMLElement>('[data-job]'));
          if (marks.length === 0) return;
          gsap.fromTo(
            marks,
            { y: 14 },
            {
              y: 0,
              duration: 0.5,
              ease: 'power3.out',
              stagger: 0.06,
              // Safe to render the from-state immediately: it is a 14 px offset,
              // so a tween that never completes leaves a marker slightly low
              // rather than a diagram that never appeared.
              immediateRender: true,
              clearProps: 'transform',
            }
          );
          const sweep = rootRef.current.querySelector<HTMLElement>('[data-sweep]');
          if (sweep) {
            gsap.fromTo(
              sweep,
              { xPercent: -120 },
              { xPercent: 320, duration: 1.6, ease: 'power1.inOut' }
            );
          }
        });
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0.15 }
    );
    io.observe(root);

    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="not-prose">
      {/* The track. Purely decorative on its own; every job below repeats its
          time in text, so the line carries no information of its own. */}
      <div className="relative mb-6 hidden h-10 overflow-hidden md:block" aria-hidden>
        <div className="via-primary/50 absolute inset-x-0 top-5 h-px bg-gradient-to-r from-transparent to-transparent" />
        <div
          data-sweep
          className="via-primary/70 absolute top-5 h-px w-1/4 bg-gradient-to-r from-transparent to-transparent"
        />
        {jobs.map((job) => (
          <div
            key={`${job.hour}:${job.minute}`}
            className="absolute top-0 -translate-x-1/2"
            style={{ left: `${job.at * 100}%` }}
          >
            <span className="text-muted-foreground text-[10px] font-semibold tabular-nums">
              {formatUtc(locale, job.hour, job.minute)}
            </span>
            <span className="bg-primary/70 mx-auto mt-1.5 block h-2 w-2 rounded-full" />
          </div>
        ))}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <li
            key={`${job.hour}:${job.minute}`}
            data-job
            className="bg-card/70 hover:border-primary/40 rounded-xl border p-4 transition-colors"
          >
            <div className="text-primary mb-1 text-xs font-semibold tabular-nums">
              {formatUtc(locale, job.hour, job.minute)}
            </div>
            <h3 className="text-sm font-semibold">{job.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{job.body}</p>
          </li>
        ))}
      </ol>

      <p className="text-muted-foreground mt-4 text-xs leading-relaxed">{caption}</p>
    </div>
  );
}
