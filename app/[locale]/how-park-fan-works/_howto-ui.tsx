import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { ChevronRight, Info, Lightbulb } from 'lucide-react';

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-border mb-6 border-b pb-3 text-xl font-bold sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

// ─── Popular Parks (async RSC – fetches geoData via cache()) ──────────────────

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

// Inline badge to illustrate how UI badges look without needing client hooks
export function DemoBadge({
  color,
  label,
  icon: Icon,
  termId,
}: {
  color: string;
  label: string;
  icon?: React.ElementType;
  termId?: string;
}) {
  return (
    <Badge className={cn('backdrop-blur-md', color)}>
      {Icon && <Icon className="h-3 w-3 text-inherit" />}
      {termId ? (
        <GlossaryTermLink
          termId={termId}
          className="cursor-help underline decoration-white/60 decoration-dashed underline-offset-2"
        >
          {label}
        </GlossaryTermLink>
      ) : (
        label
      )}
    </Badge>
  );
}

export function InfoBox({
  children,
  label = 'Hinweis',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="bg-primary/5 border-primary/20 !mt-6 rounded-lg border px-3 py-2.5 text-sm leading-relaxed">
      <div className="text-primary mb-1 flex items-center gap-1.5 font-semibold">
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

export async function TipBox({
  children,
  label = 'Tipp',
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="!mt-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5 text-sm leading-relaxed">
      <div className="mb-1 flex items-center gap-1.5 font-semibold text-yellow-600 dark:text-yellow-400">
        <Lightbulb className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      {typeof children === 'string' ? <GlossaryInject>{children}</GlossaryInject> : children}
    </div>
  );
}

export function PersonaCard({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground space-y-2 text-sm">{children}</ul>
      </CardContent>
    </Card>
  );
}

export function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </li>
  );
}
