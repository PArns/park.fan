#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" — skip a deploy whose diff cannot change the output.
#
# Wired up through `ignoreCommand` in vercel.json. Vercel's contract is inverted
# from a normal exit code: **0 skips the build, 1 proceeds with it.**
#
# Why this exists: a production build is ~5 minutes of Build CPU, the third
# largest line on the Vercel bill, and it has nothing to do with traffic. Over
# the last 40 commits on this repo, 3 touched only files that no page, route,
# manifest or bundle reads — documentation and the backlog. Those 3 built the
# whole site, prerendered 3,151 pages and shipped an identical deploy.
#
# The list below is deliberately short, and every entry has to be defensible as
# "no build step opens this file". Two near-misses that are NOT in it:
#
#   * `content/blog/**` and `public/media/**` are the inputs to
#     `generate-blog-manifest` and `generate-media-manifest`. A README lives in
#     each, and excluding a whole tree to catch it would be one glob away from
#     skipping a deploy that publishes an article.
#   * `messages/**` looks like data and is compiled into the message chunks.
#
# When in doubt this script BUILDS. A needless build costs minutes; a skipped
# build that should have run serves stale content until the next commit, and
# nothing reports it.
#
# `pnpm test:ignore-build` drives this script against a throwaway git repository
# and asserts the answer for every input a build step reads — a post in each of
# the six locales, an author, the categories, an agent SKILL.md, homepage
# content, a photo, a sidecar, a translation file, the lockfile — plus the two
# shapes a careless allowlist gets wrong: a commit touching documentation AND a
# post (a real one did, 08764e8), and `content/blog/README.md`, which an
# unanchored `README.md` pattern would swallow — plus the `[skip deploy]` marker
# below against a bare repository standing in for `origin`: in production with
# the tip ahead and with the tip unmoved, in preview, without the marker, and
# with `ls-remote` failing. It is part of `release:check`.
set -uo pipefail

# A batch of merges. The PO squash-merges every PR of a batch but the last with
# `[skip deploy]` in the message; those production builds are skipped and the
# last merge builds the batch as a whole. That works because the diff below runs
# against VERCEL_GIT_PREVIOUS_SHA — the last SUCCESSFUL deployment, which a
# skipped build never becomes — so the one build that runs sees every file the
# batch touched. At 4 PRs that is 3 production builds, ~5 minutes each, saved.
#
# Production only. A preview belongs to its pull request, where the marker in
# the eventual squash message has no business.
#
# The marker alone does not skip. A batch can end early — the last merge
# conflicts, its checks turn red, the PO is called away — and then the marked
# commit stays the tip of `main` with nothing behind it. Skipping that one
# serves the previous deployment until somebody happens to push again, which is
# the silent failure this script exists to avoid. So the marker only asks a
# question and the tip of `origin/main` answers it:
#
#   tip is a newer commit   → the batch moved on and that build carries this
#                             commit's files too → skip
#   tip is this commit      → poll until the timeout, then build
#   ls-remote fails         → build
#
# Polling, not one look: the ignore step runs seconds after the push, and the
# next merge of a batch is a minute or two behind it. Waiting is not free — the
# container is held and billed as Provisioned Memory — but it burns no Active
# CPU, and at most 5 minutes of idle buys a ~5 minute build back.
# IGNORE_BUILD_POLL_INTERVAL and IGNORE_BUILD_POLL_TIMEOUT are seconds and exist
# so `pnpm test:ignore-build` does not sit through five minutes.
#
# `refs/heads/main` is written out rather than taken from VERCEL_GIT_COMMIT_REF,
# because this block is about the production branch and about nothing else.
if [ "${VERCEL_ENV:-}" = "production" ] &&
  git log -1 --pretty=%B HEAD 2>/dev/null | grep -qF '[skip deploy]'; then
  SELF="${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse HEAD 2>/dev/null || true)}"
  POLL_INTERVAL="${IGNORE_BUILD_POLL_INTERVAL:-15}"
  POLL_TIMEOUT="${IGNORE_BUILD_POLL_TIMEOUT:-300}"
  POLL_DEADLINE=$(($(date +%s) + POLL_TIMEOUT))

  if [ -z "$SELF" ]; then
    # Without a SHA of our own there is nothing to compare the tip against.
    echo "ignore-build: HEAD is marked [skip deploy] but this commit's SHA is unknown — building."
  else
    echo "ignore-build: HEAD is marked [skip deploy] — waiting up to ${POLL_TIMEOUT}s for the rest of the batch."
    while :; do
      TIP="$(git ls-remote origin refs/heads/main 2>/dev/null | awk 'NR == 1 { print $1 }')"

      if [ -z "$TIP" ]; then
        echo "ignore-build: could not read the tip of origin/main — building."
        break
      fi

      if [ "$TIP" != "$SELF" ]; then
        echo "ignore-build: origin/main has moved on to $TIP — skipping this production build."
        echo "  that commit's build carries this one too (it diffs against the last successful deploy)."
        exit 0
      fi

      if [ "$(date +%s)" -ge "$POLL_DEADLINE" ]; then
        echo "ignore-build: marked commit is still the tip of origin/main after ${POLL_TIMEOUT}s — building."
        break
      fi

      sleep "$POLL_INTERVAL"
    done
  fi
fi

# What the previous SUCCESSFUL deployment built. Vercel only exposes this once
# an Ignored Build Step is configured, and a skipped build is not a deployment —
# so three doc commits in a row each compare against the same real deploy and
# each skip, and the next code commit compares against that deploy too.
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$BASE" ]; then
  # First build on a branch, or Vercel did not send one. Nothing to compare.
  echo "ignore-build: no VERCEL_GIT_PREVIOUS_SHA — building."
  exit 1
fi

# A Vercel checkout may be shallow enough not to contain the previous SHA.
# Fetching it is cheap; failing to is a reason to build, not to guess.
if ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=100 origin "$BASE" 2>/dev/null || true
fi
if ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  echo "ignore-build: $BASE not in this checkout — building."
  exit 1
fi

CHANGED="$(git diff --name-only "$BASE" HEAD 2>/dev/null)" || {
  echo "ignore-build: could not diff $BASE..HEAD — building."
  exit 1
}

if [ -z "$CHANGED" ]; then
  # A redeploy of the same tree. Vercel asked for it (a manual redeploy, a
  # changed environment variable), so it is not ours to refuse.
  echo "ignore-build: no file changes against $BASE — building."
  exit 1
fi

# Paths no build step reads. Anchored, so `docs/` never matches `app/docs/`.
IRRELEVANT='^(docs/|\.github/|\.impeccable/|CLAUDE\.md$|README\.md$|todo\.md$)'

RELEVANT="$(printf '%s\n' "$CHANGED" | grep -Ev "$IRRELEVANT" || true)"

if [ -z "$RELEVANT" ]; then
  echo "ignore-build: only documentation changed against $BASE — skipping the build."
  printf '%s\n' "$CHANGED" | sed 's/^/  /'
  exit 0
fi

echo "ignore-build: building — $(printf '%s\n' "$RELEVANT" | wc -l | tr -d ' ') relevant file(s) changed:"
printf '%s\n' "$RELEVANT" | head -20 | sed 's/^/  /'
exit 1
