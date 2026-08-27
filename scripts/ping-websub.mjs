#!/usr/bin/env node
/**
 * Ping the WebSub hub for every locale's blog feed, by hand.
 *
 * The cron route does this daily; this is for the moment right after publishing,
 * when waiting until 06:15 UTC is the difference between a subscriber seeing a
 * post today and seeing it tomorrow. Run it after the deploy carrying the post
 * has gone live — the hub fetches the feed the moment it is told to, and a ping
 * that arrives before the new post is served just makes the hub re-read the old
 * feed and find nothing.
 *
 *     pnpm ping:websub
 *     pnpm ping:websub --dry
 *
 * Imports `lib/websub.ts` rather than restating `hub.mode=publish` here, so the
 * script and the cron cannot drift into pinging two different hubs.
 */

import { feedUrlsForPing, pingWebSub, WEBSUB_HUB } from '../lib/websub.ts';

const dry = process.argv.includes('--dry');
const feeds = feedUrlsForPing();

console.log(`\nWebSub hub: ${WEBSUB_HUB}\n`);

if (dry) {
  for (const url of feeds) console.log(`  would ping  ${url}`);
  console.log(`\n${feeds.length} feeds, nothing sent (--dry).\n`);
  process.exit(0);
}

const results = await pingWebSub(feeds);
for (const result of results) {
  console.log(`  ${result.ok ? '✅' : '❌'} ${result.status || '—'}  ${result.url}`);
  if (result.error) console.log(`     ${result.error}`);
}

const failed = results.filter((result) => !result.ok).length;
console.log(`\n${results.length - failed}/${results.length} accepted.\n`);
process.exit(failed > 0 ? 1 : 0);
