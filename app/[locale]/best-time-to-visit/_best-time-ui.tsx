import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/marketing/scroll-reveal';

/**
 * "Powered by Fancast" CTA card linking to the model page. Hub-specific; the rest
 * of the hub's UI (hero, section shells, split figures, …) comes from the shared
 * marketing kit in `@/components/marketing/editorial-ui`.
 */
export function FancastCta({ title, body }: { title: string; body: string }) {
  return (
    <div className="container mx-auto px-4">
      <Reveal>
        <Card className="border-primary/30 from-primary/10 mx-auto max-w-3xl gap-0 bg-gradient-to-br to-transparent py-0 shadow-sm">
          <Link
            href="/fancast"
            className="group flex items-center justify-between gap-3 p-5 sm:p-6"
          >
            <span className="flex items-center gap-4">
              <span className="bg-primary/15 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <Sparkles className="text-primary h-5 w-5" />
              </span>
              <span>
                <span className="block text-lg font-semibold">{title}</span>
                <span className="text-muted-foreground block text-sm leading-relaxed">{body}</span>
              </span>
            </span>
            <ArrowRight className="text-primary h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Card>
      </Reveal>
    </div>
  );
}
