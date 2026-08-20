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
 * Everything the admin needs before it can render anything.
 *
 * The `[locale]` tree has its own QueryClientProvider and the admin is
 * deliberately outside it — it is not localized and must not pull in the routed
 * messages machinery — so it mounts its own. Without one, every `useQuery` in
 * here throws "No QueryClient set", which is the kind of failure that only
 * shows up on the first page that uses it.
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

  // A refetch failure is not a logout. React Query keeps `data` and still flips
  // the status to error, so this used to send an editor with unsaved work to
  // the login screen over a five-second API hiccup. Only a real 401 does that;
  // an outage keeps the shell standing on the identity it already has, and the
  // next successful poll clears it.
  //
  // "Only a real 401" has to include the first load, where there is no `data`
  // to stand on. A network error is not an AdminApiError, so it used to land
  // here as a logout and put the login form in front of somebody whose session
  // was fine — where every credential they typed would fail for the same
  // reason. Unreachable is its own answer, below.
  const unauthorized =
    session.error instanceof AdminApiError && session.error.isUnauthorized;
  if (session.isError && !session.data && unauthorized) return <LoginScreen />;

  // The 503 `/api/admin/session` answers when the backend cannot be reached at
  // all. It exists precisely so an outage is not read as a logout — but with
  // no branch for it, the gate fell through to the spinner below and stayed
  // there: `retry: false`, so nothing re-asked except a window-focus event,
  // and the operator watched "Sitzung wird geprüft…" indefinitely with no way
  // to trigger another attempt.
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
