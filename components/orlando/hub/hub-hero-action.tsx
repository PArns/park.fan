'use client';

import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { buttonLinkProps } from '@/components/ui/button';
import { orlandoPlannerUi } from '@/lib/orlando/planner-ui';

/**
 * The hub's one primary action, "Plan my Orlando trip": it asks the planner to open its first step
 * (the walk's first sheet on a phone, the focused panel at a desk), so a reader starts the plan with
 * one tap. The `#planner` link stays the target for a modified click and for a page without script.
 */
export function HubHeroAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      data-landing-action=""
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        orlandoPlannerUi.openStart();
      }}
      {...buttonLinkProps({ size: 'lg', withIcon: true })}
    >
      <CalendarPlus aria-hidden />
      {label}
    </Link>
  );
}
