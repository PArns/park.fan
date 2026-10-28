# Production deploys

How a merge to `main` becomes a production build, how to deploy at once, and how to set the
debounce up. Open it when production has not picked up a merge or a deploy has to go out now.

A push to `main` does not start a Vercel build: `vercel.json` sets
`git.deploymentEnabled.main: false`. `.github/workflows/deploy-production.yml` calls a Vercel
Deploy Hook once `main` has been quiet for `DEPLOY_DEBOUNCE_MINUTES` (a repository variable, 10 when
unset). Each push cancels the run still waiting, so several merges in a row (the PO, the
News-Scout, a runner, a manual session) become one build of the tip. There are no fixed deploy
times.

The build itself still runs `scripts/vercel-ignore-build.sh` (`vercel.json` `ignoreCommand`), which
skips it when nothing since the last successful deployment can change the output (documentation
only). The script decides whether; the workflow decides when. `pnpm test:ignore-build` pins
the script.

## Why the wait is in GitHub Actions

Vercel bills build time per minute **times the number of vCPUs**, and a skipped build is still a
deployment rounded up to a minute. A wait inside the Ignored Build Step therefore cost two CPU
minutes per minute on this two-core project (the old `[skip deploy]` marker polled for up to five
minutes), while a whole build costs about ten. A GitHub Actions runner on a public repository
waits for free. Build CPU minutes were the largest line of the bill, with merges minutes apart each
building the whole site
([decision and figures](../optimization/decisions.md#2026-10-26--accepted-production-deploys-wait-in-github-actions-not-in-vercel)).

## Deploying now

- A commit message containing `[deploy now]` skips the wait.
- **Actions → deploy production → Run workflow** deploys the tip of `main`; `wait_minutes`
  defaults to 0.
- **Deployments → Redeploy** in Vercel still works and does not involve the workflow.

## Setup

1. Vercel, project park.fan, **Settings → Git → Deploy Hooks**: a hook `production-debounce` for
   `main`; copy its URL.
2. GitHub, **Settings → Secrets and variables → Actions**: the secret
   `VERCEL_DEPLOY_HOOK_PRODUCTION` with that URL, optionally the variable `DEPLOY_DEBOUNCE_MINUTES`.

Without the secret the workflow fails with an error naming it, nothing deploys `main`, and GitHub
mails the failure to whoever pushed.

## Checking it works

The run **deploy production** shows the wait and then the hook's answer
(`{"job":{"id":…,"state":"PENDING"}}`). Vercel lists the build as triggered by the deploy hook, and
its log starts with `ignore-build:`. The deploy webhook still purges Cloudflare on
`deployment.promoted` ([CDN caching](../architecture/cdn-caching.md#a-deploy-purges-cloudflare)).
If no deployment appears, revert the `git` block in `vercel.json` and every push to `main` builds
again.

Vercel accepts 60 deploy-hook calls an hour per project, and a hook call for the commit it is
already deploying cancels the earlier deployment.
