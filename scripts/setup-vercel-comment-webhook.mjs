#!/usr/bin/env node
/**
 * Registers the Vercel webhook that feeds the Preview-Comment → PR sync.
 *
 * This has to go through the REST API: Vercel's dashboard only offers
 * deployment / project / flag / firewall events, but `POST /v1/webhooks`
 * accepts the `comment.*` and `thread.*` events too (they are listed in
 * Vercel's public OpenAPI schema, just not in the UI or the docs).
 *
 * Usage:
 *   VERCEL_API_TOKEN=… node scripts/setup-vercel-comment-webhook.mjs
 *   VERCEL_API_TOKEN=… node scripts/setup-vercel-comment-webhook.mjs --list
 *   VERCEL_API_TOKEN=… node scripts/setup-vercel-comment-webhook.mjs --delete <id>
 *
 * Env:
 *   VERCEL_API_TOKEN  (required)  https://vercel.com/account/tokens
 *   VERCEL_TEAM_ID    (optional)  needed for team-scoped projects
 *   VERCEL_PROJECT_ID (optional)  scopes the webhook to one project
 *   WEBHOOK_URL       (optional)  defaults to the production route
 *
 * The secret is printed once and never again — put it into the Vercel project
 * as VERCEL_COMMENT_WEBHOOK_SECRET. See docs/development/vercel-comment-sync.md.
 */

const TOKEN = process.env.VERCEL_API_TOKEN;
const TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://park.fan/api/webhooks/vercel-comments';

const EVENTS = [
  'comment.created',
  'comment.updated',
  'comment.resolved',
  'comment.unresolved',
  'thread.resolved',
  'thread.unresolved',
];

if (!TOKEN) {
  console.error('✗ VERCEL_API_TOKEN is required (https://vercel.com/account/tokens)');
  process.exit(1);
}

function endpoint(path) {
  const url = new URL(`https://api.vercel.com${path}`);
  if (TEAM_ID) url.searchParams.set('teamId', TEAM_ID);
  return url;
}

async function api(path, options = {}) {
  const response = await fetch(endpoint(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    console.error(`✗ ${options.method || 'GET'} ${path} → ${response.status}`);
    console.error(text);
    process.exit(1);
  }
  return text ? JSON.parse(text) : null;
}

async function list() {
  const webhooks = await api('/v1/webhooks');
  const items = Array.isArray(webhooks) ? webhooks : (webhooks?.webhooks ?? []);
  if (items.length === 0) {
    console.log('No webhooks configured.');
    return;
  }
  for (const hook of items) {
    console.log(`\n${hook.id}`);
    console.log(`  url:    ${hook.url}`);
    console.log(`  events: ${(hook.events || []).join(', ')}`);
  }
}

async function remove(id) {
  await api(`/v1/webhooks/${id}`, { method: 'DELETE' });
  console.log(`✓ Deleted webhook ${id}`);
}

async function create() {
  const body = { url: WEBHOOK_URL, events: EVENTS };
  if (PROJECT_ID) body.projectIds = [PROJECT_ID];

  const webhook = await api('/v1/webhooks', { method: 'POST', body: JSON.stringify(body) });

  console.log('✓ Webhook created\n');
  console.log(`  id:     ${webhook.id}`);
  console.log(`  url:    ${WEBHOOK_URL}`);
  console.log(`  events: ${EVENTS.join(', ')}`);
  console.log(`\n  secret: ${webhook.secret}\n`);
  console.log('Store that secret now — Vercel will not show it again:');
  console.log('  vercel env add VERCEL_COMMENT_WEBHOOK_SECRET production');
}

const [flag, value] = process.argv.slice(2);
if (flag === '--list') await list();
else if (flag === '--delete') {
  if (!value) {
    console.error('✗ --delete needs a webhook id (see --list)');
    process.exit(1);
  }
  await remove(value);
} else await create();
