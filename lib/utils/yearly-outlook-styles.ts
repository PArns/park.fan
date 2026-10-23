import type { CSSProperties } from 'react';

import { UNUSABLE_HATCH_IMAGE } from '@/lib/utils/hatch';

/**
 * The twelve-month outlook's grey slots, in a plain module so the server-rendered frame and the
 * client strip read the same strings (a constant exported from a `'use client'` file reaches a
 * Server Component as a reference, not a value).
 */

/** A slot whose value has not arrived, or a future day the forecast does not cover. */
export const OUTLOOK_PENDING_FILL = 'bg-muted/60';

/** A day that is already over, fainter than one the forecast has not reached. */
export const OUTLOOK_PAST_FILL = 'bg-muted/25';

/** A closed day: the pending tone under the site's hatch for time nobody can use. */
export const OUTLOOK_CLOSED_STYLE: CSSProperties = { backgroundImage: UNUSABLE_HATCH_IMAGE };
