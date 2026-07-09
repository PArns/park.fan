#!/usr/bin/env node
/**
 * `pnpm dev:live` — start the Next.js dev server for an impeccable **live mode**
 * (annotation overlay) session.
 *
 * impeccable's live overlay is agent-driven: it only attaches while an AI
 * harness session is running `/impeccable live` (which boots the local live
 * helper server, injects the overlay `<script>` with a per-session port+token,
 * and long-polls for your annotations). This wrapper just starts the dev server
 * — the prerequisite the live skill needs — and prints how to attach the
 * overlay. Nothing here ships to preview/production; the overlay never leaves
 * your local dev server.
 *
 * Plain `pnpm dev` stays untouched (no overlay, no extra process).
 */
import { spawn } from 'node:child_process';

const cyan = (s) => `[36m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const bold = (s) => `[1m${s}[0m`;

console.log(
  [
    '',
    bold('  impeccable live — annotation overlay'),
    dim('  ────────────────────────────────────'),
    `  1. Leave this running (Next.js dev server, HMR).`,
    `  2. In your AI harness run  ${cyan('/impeccable live')}`,
    `     (one-time setup: ${cyan('pnpm impeccable:install')} then ${cyan('/impeccable init')}).`,
    `  3. Pick an element → leave a comment/stroke → get variants via HMR.`,
    dim('  Dev-only. The overlay never ships to preview or production.'),
    '',
  ].join('\n')
);

// Forward to the normal dev server; keep flags identical to `pnpm dev`.
const child = spawn('next', ['dev', '--turbopack'], {
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

const forward = (sig) => () => child.kill(sig);
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
