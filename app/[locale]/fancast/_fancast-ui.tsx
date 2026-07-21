import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { FaqStructuredData } from '@/components/seo/structured-data';
import type { CrowdLevel } from '@/lib/api/types';
import { ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';

// ── Table of contents ────────────────────────────────────────────────────────
export function TocNav({ label, items }: { label: string; items: Array<[string, string]> }) {
  return (
    <nav aria-label={label} className="bg-muted/40 not-prose mt-8 rounded-xl border p-5">
      <p className="mb-3 font-semibold">{label}</p>
      <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
        {items.map(([href, text]) => (
          <li key={href}>
            <a href={href} className="hover:text-foreground transition-colors">
              {text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// ── Lede paragraph (larger, emphasised) ──────────────────────────────────────
export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-lg leading-relaxed font-medium">{children}</p>;
}

// ── Anchored section with an h2 heading ──────────────────────────────────────
export function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="border-border flex items-center gap-2.5 border-b pb-3 text-xl font-bold sm:text-3xl">
        {Icon && <Icon className="text-primary h-6 w-6 shrink-0" />}
        {title}
      </h2>
      {children}
    </section>
  );
}

// ── Plain body paragraph ─────────────────────────────────────────────────────
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed">{children}</p>;
}

// ── The honesty punchline callout (primary tint) ─────────────────────────────
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border-primary/20 flex gap-3 rounded-xl border p-4 text-base leading-relaxed sm:p-5">
      <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-foreground/90">{children}</p>
    </div>
  );
}

// ── A single "what it reads" ingredient card ─────────────────────────────────
export function IngredientCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon className="text-primary h-4 w-4 shrink-0" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
      </CardContent>
    </Card>
  );
}

export function IngredientGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

// ── Crowd-level legend (reuses CrowdLevelBadge for consistent colours) ────────
export function CrowdLegend({
  items,
}: {
  items: Array<{ level: CrowdLevel | 'closed'; text: string }>;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.level}
          className="bg-muted/30 flex items-start gap-3 rounded-lg border p-3"
        >
          <div className="shrink-0">
            <CrowdLevelBadge level={item.level} />
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── "Where you meet Fancast" linked list ─────────────────────────────────────
export function TouchpointList({
  items,
}: {
  items: Array<{ title: string; body: React.ReactNode }>;
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Sparkles className="text-primary mt-1 h-4 w-4 shrink-0" />
          <span className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">{item.title}</strong> — {item.body}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── FAQ: visible accordion-ish list + FAQPage structured data ────────────────
export function FaqList({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  return (
    <>
      <FaqStructuredData items={items} />
      <div className="divide-border divide-y">
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
