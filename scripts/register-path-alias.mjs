// Registers the `@/*` path-alias resolve hook for standalone node test scripts.
// Used via `node --import ./scripts/register-path-alias.mjs ...`.
import { register } from 'node:module';

register('./path-alias-hooks.mjs', import.meta.url);
