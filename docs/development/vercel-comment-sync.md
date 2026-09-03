# Vercel Preview Comments → GitHub PR

Mirrors [Vercel Preview Comments](https://vercel.com/docs/comments) onto the matching pull request, so feedback left in the Vercel toolbar (text, page, DOM selector, source file, screenshot) is readable in the PR — by humans and by Claude.

Only **preview** deployments are synced. Production and localhost comments have no PR to go to and are dropped.

---

## 1. Why a relay is needed

Vercel exposes no REST API for comments ([open feature request](https://community.vercel.com/t/sync-vercel-preview-deployment-comments-to-github-pr-for-ai-agent-feedback-loops/31663)). It does emit `comment.*` webhooks — but they are **not offered in the dashboard UI**; they only exist in Vercel's [public OpenAPI schema](https://openapi.vercel.sh/) for `POST /v1/webhooks`, so the webhook must be created via the API.

GitHub Actions cannot receive webhooks either, so the chain is:

```
Vercel comment.created / .updated / .resolved / thread.resolved
  ─▶ POST https://park.fan/api/webhooks/vercel-comments
       verify x-vercel-signature (HMAC-SHA1) → normalize → PREVIEW gate
  ─▶ repository_dispatch `vercel-comment`
  ─▶ .github/workflows/vercel-comment-sync.yml
  ─▶ one PR comment per Vercel thread
```

| Piece                                   | File                                        |
| --------------------------------------- | ------------------------------------------- |
| Webhook receiver, signature check, gate | `app/api/webhooks/vercel-comments/route.ts` |
| Payload normalizer (deep scan)          | `lib/vercel-comments/normalize.ts`          |
| Markdown renderer                       | `lib/vercel-comments/render.ts`             |
| PR poster                               | `scripts/ci/sync-vercel-comment.mjs`        |
| Workflow                                | `.github/workflows/vercel-comment-sync.yml` |
| Webhook registration                    | `scripts/setup-vercel-comment-webhook.mjs`  |

> **Requires a Vercel Pro or Enterprise team** — account webhooks are not available on Hobby.

---

## 2. Setup

### a) GitHub token

The dispatch reuses the credential the admin routes already established — `GITHUB_DISPATCH_TOKEN` → `BLOG_EDITOR_GITHUB_TOKEN` → `GITHUB_TOKEN`, and the repo comes from `VERCEL_COMMENT_SYNC_REPO` → `GITHUB_REPOSITORY` → `PArns/park.fan`. **If the blog editor already works on this deployment, there is nothing to add here.** Set `GITHUB_DISPATCH_TOKEN` only to give the dispatch its own, narrower credential (a fine-grained PAT with **Contents: write** is all `repository_dispatch` needs). The workflow itself runs with the built-in `GITHUB_TOKEN`.

### b) Vercel env vars (Production scope)

```bash
vercel env add VERCEL_API_TOKEN production   # optional but recommended
```

`VERCEL_API_TOKEN` lets the route look the deployment up (`GET /v13/deployments/:id`) to recover the git branch, the **commit SHA** and the preview/production target when the comment payload does not carry them. Without it, comments whose environment cannot be determined are **dropped** rather than guessed.

### c) Register the webhook

```bash
VERCEL_API_TOKEN=… VERCEL_TEAM_ID=… node scripts/setup-vercel-comment-webhook.mjs
```

It prints a signing secret **once**. Store it immediately:

```bash
vercel env add VERCEL_COMMENT_WEBHOOK_SECRET production
```

Then redeploy production so the route picks both secrets up.

Other modes: `--list`, `--delete <id>`.

### d) Optional GitHub secret

Add `VERCEL_API_TOKEN` as a **repository secret** if Vercel serves comment screenshots from authenticated URLs — the workflow then downloads them and re-hosts them (see below). Without it, unreachable images are skipped and the original link is kept.

---

## 3. What the PR comment looks like

One PR comment per Vercel thread, anchored by a hidden marker (`<!-- vercel-comment-sync:thread:… -->`):

- **Heading** — flips to ✅ when the thread is resolved.
- **Quoted comment text** (markdown and `:emoji:` intact) and author.
- **Context table** — page, source file, component, DOM selector, position, viewport, mentions, timestamp, branch, commit, deployment, browser.
- **Screenshots**, inline.
- **`Context for automation (JSON)`** — a stable, flat JSON block in a `json vercel-comment-context` fence. Parse this, not the prose.
- **`Raw Vercel webhook payload`** — the untouched payload, collapsed.

Replies are appended to the same comment; resolving flips the heading.

Everything Vercel lets a person put into a comment reaches the PR: text with markdown, emoji and `@mentions`, the placement (anchor point, or the rectangle of a click-and-drag region screenshot), the DOM selector and component the toolbar recorded, uploaded and camera screenshots, and the session context needed to reproduce it.

### The commit a comment belongs to

Feedback is about the deployment of **one commit**, and the branch often moves on before the webhook lands — Vercel itself warns that people comment on outdated previews. The commit SHA is carried through, and when it no longer matches the PR head the comment opens with a warning naming both, so nobody acts on feedback for code that has already changed.

### Size

Two hard 65,536-character ceilings sit downstream (a `repository_dispatch` payload and a comment body), and a long comment lands in the output three times over — quote, context JSON, raw payload. Each block is capped, the rendered body is capped again at 60,000, and appends trim the middle of a long thread rather than failing the update. The marker and the newest reply always survive a trim.

### Untrusted input

Comment text is written by anyone who can reach the preview, so the thread marker is neutralized inside it — otherwise a comment containing someone else's anchor would redirect later replies to the wrong PR comment.

### Screenshots

Vercel serves attachments from authenticated URLs that GitHub cannot render. The workflow downloads each image and commits it to the orphan-ish branch `vercel-comment-assets` (created automatically off `main`, never merged), then embeds the public `raw.githubusercontent.com` URL. Files are content-addressed by SHA-1, so a re-posted screenshot does not duplicate.

---

## 4. The payload is undocumented

Vercel does not publish the shape of `comment.*` payloads, and it may change without notice. So `normalizeComment()` does **not** hard-code paths like `payload.comment.author.name`. It breadth-first scans the payload and picks fields by key name, shallowest match first.

Two consequences worth knowing:

- If Vercel renames a field, the context table loses a row — but the comment still syncs, and the raw payload block still has everything.
- Once you have seen a real payload in the PR's raw block, you can tighten `normalize.ts` to read the exact paths.

---

## 5. Toggles

| Toggle                                      | Where              | Effect                                                  |
| ------------------------------------------- | ------------------ | ------------------------------------------------------- |
| `VERCEL_COMMENT_SYNC=off`                   | Vercel env         | Route drops every incoming webhook.                     |
| `VERCEL_COMMENT_SYNC` repo variable = `off` | GitHub → Variables | Workflow skips.                                         |
| `VERCEL_COMMENT_SYNC_UNKNOWN=on`            | Vercel env         | Sync even when the environment could not be determined. |
| `VERCEL_PRODUCTION_BRANCH`                  | Vercel env         | Branch treated as production (default `main`).          |
| `VERCEL_COMMENT_SYNC_REPO`                  | Vercel env         | Dispatch target (default `PArns/park.fan`).             |

---

## 6. Troubleshooting

**Nothing arrives.** Check the function logs for `/api/webhooks/vercel-comments`. A `403` means the signing secret in Vercel does not match the one from the setup script — re-run it and store the new secret.

**Route answers `200 {"reason": "..."}`.** That is by design: the reason says why it stopped (`production comment ignored`, `environment could not be determined`, `no branch or PR to map to`). Non-2xx would only make Vercel retry.

**Dispatch fires but no comment appears.** The branch has no open PR, or `GITHUB_DISPATCH_TOKEN` lacks _Contents: write_. The workflow logs which branch it looked for.

**Screenshots do not render.** Check the workflow log for `! Skipping image` — usually the URL needs the `VERCEL_API_TOKEN` repository secret.
