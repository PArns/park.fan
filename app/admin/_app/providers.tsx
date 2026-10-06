'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminApiError } from '../_lib/api';
import { Button } from '@/components/ui/button';
import { LoadingState } from '../_ui/primitives';
import { ToastHost } from '../_ui/toast';
import { InspectorProvider } from './inspector';
import { LoginScreen } from './login-screen';
import { SessionProvider, useSessionQuery } from './session';
import { AdminShell } from './admin-shell';
import { MustChangePassword } from './must-change-password';

/**
 * Everything the admin needs before it renders, including its own QueryClientProvider: the admin
 * sits outside the `[locale]` tree that has one.
 */
export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Admin data is small and correctness matters more than a
            // round trip: a stale curated value shown as current is how a
            // second editor overwrites the first one's work.
            staleTime: 10_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              // Never retry an auth failure. Retrying a 401 three times just
              // delays the login screen by a second and a half.
              if (error instanceof AdminApiError && error.status < 500) return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: false },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastHost>
        <SessionGate>{children}</SessionGate>
      </ToastHost>
    </QueryClientProvider>
  );
}

function SessionGate({ children }: { children: ReactNode }) {
  const session = useSessionQuery();

  if (session.isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoadingState label="Sitzung wird geprüft…" />
      </div>
    );
  }

  // A refetch failure is not a logout: only a real 401 with no identity to stand on shows the
  // login screen. An outage keeps the shell on the identity it has, and an unreachable backend on
  // the first load gets its own answer below.
  const unauthorized = session.error instanceof AdminApiError && session.error.isUnauthorized;
  if (session.isError && !session.data && unauthorized) return <LoginScreen />;

  // The backend is unreachable (the session route's 503): say so and offer a retry, since the
  // query does not retry by itself.
  if (session.isError && !session.data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm font-medium">Das Backend antwortet gerade nicht.</p>
        <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
          Die Anmeldung ist davon unberührt — sobald api.park.fan wieder erreichbar ist, geht es
          hier weiter, ohne dass jemand neu anmelden muss.
        </p>
        <Button size="sm" variant="ghost" onClick={() => void session.refetch()}>
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (!session.data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <LoadingState label="Sitzung wird geprüft…" />
      </div>
    );
  }

  // An account with a temporary password can reach exactly one screen. The
  // backend enforces the same rule, so this is the polite half of it: without
  // it the admin would render fully and then 403 on every request.
  if (session.data.mustChangePassword) {
    return (
      <SessionProvider identity={session.data}>
        <MustChangePassword />
      </SessionProvider>
    );
  }

  return (
    <SessionProvider identity={session.data}>
      <InspectorProvider>
        <AdminShell>{children}</AdminShell>
      </InspectorProvider>
    </SessionProvider>
  );
}
