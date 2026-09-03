import { createFlagsDiscoveryEndpoint } from 'flags/next';
import { getProviderData } from '@flags-sdk/vercel';
import * as flags from '@/flags';

/**
 * What Flags Explorer reads to list this app's flags and offer overrides.
 *
 * Like every other document under `/.well-known/`, no page in this site renders
 * it — so it can rot through a green build and every passing suite, and the
 * first symptom is a Toolbar with an empty flag list. Unlike the others it is
 * NOT part of the agent surface and is deliberately absent from
 * `pnpm check:agent-ready`: `createFlagsDiscoveryEndpoint` authenticates against
 * `FLAGS_SECRET`, so an unauthenticated fetch answers 401 by design and a check
 * asserting 200 would be asserting the guard is broken.
 */
export const GET = createFlagsDiscoveryEndpoint(async () => getProviderData(flags));
