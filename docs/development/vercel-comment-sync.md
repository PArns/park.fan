# Vercel preview comments → GitHub PR

Mirrors [Vercel preview comments](https://vercel.com/docs/comments) onto the matching pull request,
so toolbar feedback (text, page, DOM selector, source file, screenshot) is readable in the PR by
people and by Claude. Open it to set the sync up or to find out why a comment did not arrive. Only
**preview** deployments are synced; production and localhost comments have no PR and are dropped.

## The chain

Vercel has no REST API for comments
([feature request](https://community.vercel.com/t/sync-vercel-preview-deployment-comments-to-github-pr-for-ai-agent-feedback-loops/31663)).
It emits `comment.*` webhooks, but the dashboard does not offer them: they exist only in the
[OpenAPI schema](https://openapi.vercel.sh/) for `POST /v1/webhooks`, so the webhook is created
through the API. GitHub Actions cannot receive a webhook, hence a relay:

```
Vercel comment.created / .updated / .resolved / thread.resolved
  ─▶ POST https://park.fan/api/webhooks/vercel-comments
       verify x-vercel-signature (HMAC-SHA1) → normalize → preview gate
  ─▶ repository_dispatch `vercel-comment`
  ─▶ .github/workflows/vercel-comment-sync.yml
  ─▶ one PR comment per Vercel thread
```

| Piece                                   | File                                        |
| --------------------------------------- | ------------------------------------------- |
| Webhook receiver, signature check, gate | `app/api/webhooks/vercel-comments/route.ts` |
| Payload normalizer                      | `lib/vercel-comments/normalize.ts`          |
| Markdown renderer                       | `lib/vercel-comments/render.ts`             |
| PR poster                               | `scripts/ci/sync-vercel-comment.mjs`        |
| Workflow                                | `.github/workflows/vercel-comment-sync.yml` |
| Webhook registration                    | `scripts/setup-vercel-comment-webhook.mjs`  |

Account webhooks need a Vercel **Pro or Enterprise** team.

## Setup

1. **GitHub token.** A fine-grained PAT on `PArns/park.fan` with **Contents: read & write** (what
   `repository_dispatch` needs). It only fires the dispatch; the workflow runs on `GITHUB_TOKEN`.
2. **Vercel env (Production):** `vercel env add GITHUB_DISPATCH_TOKEN production`, and optionally
   `VERCEL_API_TOKEN`, which lets the route look the deployment up (`GET /v13/deployments/:id`) for
   the branch and target when the payload lacks them. Without it a comment whose environment
   cannot be determined is dropped, not guessed.
3. **Register the webhook:**
   `VERCEL_API_TOKEN=… VERCEL_TEAM_ID=… node scripts/setup-vercel-comment-webhook.mjs` (also
   `--list`, `--delete <id>`). It prints the signing secret **once**; store it as
   `VERCEL_COMMENT_WEBHOOK_SECRET` (Production) and redeploy production.
4. **Optional:** `VERCEL_API_TOKEN` as a **repository secret**, so the workflow can download
   screenshots Vercel serves from authenticated URLs. Without it those are skipped and the original
   link is kept.

## The PR comment

One comment per Vercel thread, found again by a hidden marker
(`<!-- vercel-comment-sync:thread:… -->`). Replies are appended; resolving flips the heading to ✅.
It carries the quoted text and author, a context table (page, source file, component, selector,
position, viewport, branch, deployment, browser), the screenshots inline, a
`json vercel-comment-context` fence (**parse this, not the prose**) and the raw payload, collapsed.

Screenshots are downloaded and committed to the branch `vercel-comment-assets` (created off `main`,
never merged), content-addressed by SHA-1, and embedded from `raw.githubusercontent.com`.

**The payload shape is undocumented** and may change, so `normalizeComment()` does not hard-code
paths; it scans the payload breadth-first and picks fields by key name, shallowest first. A renamed
field loses one row of the context table and nothing else; the raw block still has everything.
Once a real payload is visible in a PR, `normalize.ts` can read exact paths.

## Toggles

| Toggle                                      | Where              | Effect                                                 |
| ------------------------------------------- | ------------------ | ------------------------------------------------------ |
| `VERCEL_COMMENT_SYNC=off`                   | Vercel env         | the route drops every webhook                          |
| `VERCEL_COMMENT_SYNC` repo variable = `off` | GitHub → Variables | the workflow skips                                     |
| `VERCEL_COMMENT_SYNC_UNKNOWN=on`            | Vercel env         | sync even when the environment could not be determined |
| `VERCEL_PRODUCTION_BRANCH`                  | Vercel env         | branch treated as production (default `main`)          |
| `VERCEL_COMMENT_SYNC_REPO`                  | Vercel env         | dispatch target (default `PArns/park.fan`)             |

## Troubleshooting

- **Nothing arrives.** Check the function logs of `/api/webhooks/vercel-comments`. A `403` means
  the signing secret does not match: re-run the setup script and store the new one.
- **`200 {"reason": "…"}`** is by design and names why it stopped (`production comment ignored`,
  `environment could not be determined`, `no branch or PR to map to`); a non-2xx would only make
  Vercel retry.
- **Dispatch fires, no comment.** The branch has no open PR, or `GITHUB_DISPATCH_TOKEN` lacks
  Contents: write. The workflow log names the branch it looked for.
- **Screenshots missing.** Look for `! Skipping image` in the workflow log; usually the
  `VERCEL_API_TOKEN` repository secret is missing.
