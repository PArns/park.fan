import { type LucideIcon } from 'lucide-react';

/** Dashboard section: icon, uppercase heading, an optional action on the right, content below. */
export function Section({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="text-primary h-4 w-4" />
        <h2 className="text-foreground/70 text-sm font-semibold tracking-wide uppercase">
          {title}
        </h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {children}
    </section>
  );
}
