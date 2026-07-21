import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { FaqStructuredData } from '@/components/seo/structured-data';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground mb-10 text-lg leading-relaxed">{children}</p>;
}

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

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground max-w-3xl leading-relaxed">{children}</p>;
}

/** Glossary-aware paragraph (string children only). */
export function PG({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground max-w-3xl leading-relaxed">
      <GlossaryInject>{children}</GlossaryInject>
    </p>
  );
}

/** Icon list for tips / tactics. */
export function TipList({
  items,
}: {
  items: Array<{ icon: React.ElementType; title: string; body: React.ReactNode }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i} className="bg-card flex h-full gap-3 rounded-xl border p-4">
          <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <item.icon className="text-primary h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** "Powered by Fancast" CTA card linking to the model page. */
export function FancastCta({ title, body }: { title: string; body: string }) {
  return (
    <Card className="border-primary/30 from-primary/10 gap-0 bg-gradient-to-br to-transparent py-0 shadow-sm">
      <Link href="/fancast" className="group flex items-center justify-between gap-3 p-5">
        <span className="flex items-center gap-3">
          <span className="bg-primary/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="text-primary h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold">{title}</span>
            <span className="text-muted-foreground block text-sm">{body}</span>
          </span>
        </span>
        <ArrowRight className="text-primary h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </Card>
  );
}

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

// Re-export for convenience in content modules.
export { CardContent };
