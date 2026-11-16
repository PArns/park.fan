import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AUTH_CARD_CLASS, AuthCardHairline } from '@/components/common/auth-card';
import { cn } from '@/lib/utils';

/** One area of the account page: an icon, a heading, a line under it, and its content. */
export function AccountSection({
  icon: Icon,
  title,
  lead,
  tone = 'default',
  children,
}: {
  icon: LucideIcon;
  title: string;
  lead?: ReactNode;
  /** `danger` for the account's deletion. */
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        tone === 'danger' ? 'border-destructive/30 rounded-3xl border p-6' : AUTH_CARD_CLASS,
        'space-y-5'
      )}
    >
      {tone === 'default' && <AuthCardHairline />}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl',
            tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          {lead && <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A line of feedback under a form: green when it worked, red when not. */
export function FormNote({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('text-sm', tone === 'error' ? 'text-destructive' : 'text-emerald-500')}
    >
      {children}
    </p>
  );
}
