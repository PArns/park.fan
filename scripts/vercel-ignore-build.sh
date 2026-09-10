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
set -uo pipefail

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
