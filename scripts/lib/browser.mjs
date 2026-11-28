import { existsSync } from 'node:fs';

/**
 * Where CI and the dev container ship a Chromium; `playwright install` is blocked there.
 * `CHROMIUM_PATH` names another one.
 */
const PREINSTALLED = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium';

/**
 * The options every browser script passes to `chromium.launch`: the preinstalled Chromium when it
 * is there, otherwise nothing, which leaves the choice to Playwright's own resolution.
 */
export const LAUNCH = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};
