import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { FaqStructuredData } from '@/components/seo/structured-data';
import type { CrowdLevel } from '@/lib/api/types';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Reveal, ScrollCue } from './_fancast-motion';

// ── Full-bleed hero ──────────────────────────────────────────────────────────
export function Hero({
  kicker,
  title,
  tagline,
  imageSrc,
  imageAlt,
  stats,
  scrollLabel,
}: {
  kicker: string;
  title: string;
  tagline: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  scrollLabel: string;
}) {
  return (
    <header className="relative isolate -mt-14 flex min-h-[78vh] items-end overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover motion-safe:scale-105"
      />
      {/* Readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 to-transparent" />

      <div className="relative container mx-auto px-4 pt-32 pb-20 text-white">
        <Reveal>
          <p className="text-primary-foreground/80 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
            <span className="bg-primary inline-block h-2 w-2 rounded-full" />
            {kicker}
          </p>
          <h1 className="text-6xl font-black tracking-tight sm:text-8xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-2xl">
            {tagline}
          </p>
        </Reveal>

        <Reveal delay={150}>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
            {stats.map((s) => (
              <div key={s.label} className="min-w-[6rem]">
                <dt className="text-3xl font-bold tabular-nums sm:text-4xl">{s.value}</dt>
                <dd className="text-xs tracking-wide text-white/60 uppercase">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <ScrollCue label={scrollLabel} />
    </header>
  );
}

// ── Numbered section shell (Almanac-style "01 / 02 / …") ─────────────────────
export function SectionShell({
  id,
  index,
  kicker,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  index: string;
  kicker?: string;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="container mx-auto px-4">
        <Reveal>
          <div className="border-border mb-8 flex items-start gap-4 border-b pb-5">
            <span className="text-primary/15 text-5xl leading-none font-black tabular-nums sm:text-7xl">
              {index}
            </span>
            <div className="pt-1">
              {kicker && (
                <div className="text-primary mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {kicker}
                </div>
              )}
              <h2 className="text-2xl font-bold sm:text-4xl">{title}</h2>
            </div>
          </div>
        </Reveal>
        <div className="space-y-5">{children}</div>
      </div>
    </section>
  );
}

// ── Text primitives ──────────────────────────────────────────────────────────
// Running text is capped at a readable measure (max-w-3xl) while its parent
// section spans the full site width, so prose stays legible next to full-bleed
// grids and figures.
export function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-foreground/80 max-w-3xl text-xl leading-relaxed font-medium">{children}</p>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground max-w-3xl leading-relaxed">{children}</p>;
}

/** Glossary-aware paragraph — auto-links known terms (string children only). */
export function PG({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground max-w-3xl leading-relaxed">
      <GlossaryInject>{children}</GlossaryInject>
    </p>
  );
}

export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <div className="from-primary/10 border-primary/20 flex max-w-3xl gap-3 rounded-2xl border bg-gradient-to-br to-transparent p-5 text-base leading-relaxed sm:p-6">
        <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-foreground/90">{children}</p>
      </div>
    </Reveal>
  );
}

// ── "What it reads" ingredient cards ─────────────────────────────────────────
export function IngredientGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function IngredientCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Card className="hover:border-primary/40 h-full py-0 transition-colors">
        <CardContent className="flex h-full flex-col gap-2 p-5">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <h3 className="mt-1 font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
        </CardContent>
      </Card>
    </Reveal>
  );
}

// ── Crowd-level spectrum: gradient bar + coloured cards ───────────────────────
const CROWD_SPECTRUM = 'linear-gradient(90deg,#0d9488,#10b981,#22c55e,#f97316,#f43f5e,#dc2626)';

export function CrowdSpectrum({
  items,
}: {
  items: Array<{ level: CrowdLevel | 'closed'; text: string }>;
}) {
  return (
    <div className="space-y-5">
      <Reveal>
        <div
          className="h-3 w-full rounded-full"
          style={{ background: CROWD_SPECTRUM }}
          aria-hidden
        />
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.level} delay={i * 60}>
            <div className="bg-card h-full rounded-xl border p-4">
              <CrowdLevelBadge level={item.level} />
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ── Alternating image/text row for editorial examples ────────────────────────
export function SplitFigure({
  src,
  alt,
  kicker,
  title,
  children,
  reverse = false,
  badge,
}: {
  src: string;
  alt: string;
  kicker?: string;
  title: string;
  children: React.ReactNode;
  reverse?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Reveal>
      <div className="grid items-center gap-6 md:grid-cols-2 md:gap-10">
        <div
          className={cn(
            'relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-lg',
            reverse && 'md:order-2'
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
          />
        </div>
        <div className="space-y-3">
          {kicker && (
            <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              {kicker}
            </div>
          )}
          <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{children}</p>
          {badge && <div className="pt-1">{badge}</div>}
        </div>
      </div>
    </Reveal>
  );
}

// ── Standalone captioned figure ──────────────────────────────────────────────
export function Figure({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <Reveal>
      <figure className="space-y-2">
        <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-2xl border shadow-md">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            priority={priority}
          />
        </div>
        {caption && (
          <figcaption className="text-muted-foreground text-center text-sm italic">
            {caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}

// ── "Where you meet Fancast" — icon cards ────────────────────────────────────
export function TouchpointGrid({
  items,
}: {
  items: Array<{ icon: React.ElementType; title: string; body: React.ReactNode }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <Reveal key={i} delay={i * 60}>
          <div className="bg-card flex h-full gap-3 rounded-xl border p-4">
            <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <item.icon className="text-primary h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{item.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ── FAQ: accordion + FAQPage structured data ─────────────────────────────────
export function FaqList({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  return (
    <>
      <FaqStructuredData items={items} />
      <div className="divide-border max-w-3xl divide-y">
        {items.map((item) => (
          <details key={item.question} className="group py-3">
            <summary
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 font-semibold',
                'marker:content-none [&::-webkit-details-marker]:hidden'
              )}
            >
              {item.question}
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
            </summary>
            <p className="text-muted-foreground mt-2 leading-relaxed">{item.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}
