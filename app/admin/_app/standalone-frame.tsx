'use client';

import type { ReactNode } from 'react';
import { AdminBrand } from '../_ui/admin-brand';

/**
 * Admin routes that open from a link somebody else sent, so they get no sidebar, palette or
 * `g`-then-letter jumps: a page that asks for a decision keeps the way out to the decision.
 */
const STANDALONE_ROUTES = ['/admin/oauth/'];

/** Whether `pathname` is a route that renders in `StandaloneFrame` instead of the shell. */
export function isStandaloneRoute(pathname: string): boolean {
  return STANDALONE_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * The frame of a standalone admin route: the brand line over one centred column, on the same
 * background as the shell.
 */
export function StandaloneFrame({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col gap-5 px-4 py-6 sm:py-12">
      <p>
        <AdminBrand />
      </p>
      {children}
    </main>
  );
}
