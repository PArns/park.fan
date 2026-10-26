# Production deploys

A push to `main` does not start a Vercel build. `vercel.json` sets
`git.deploymentEnabled.main: false`, and `.github/workflows/deploy-production.yml` starts the
production build through a Vercel Deploy Hook once `main` has been quiet for
`DEPLOY_DEBOUNCE_MINUTES` (a repository variable, 10 when unset). Every push cancels the run that
is still waiting, so several merges in a row, from the PO, the News-Scout, a runner and a manual
session alike, become one build of the tip. There are no fixed deploy times.

The build itself still runs `scripts/vercel-ignore-build.sh`, which skips it when nothing since
the last successful deployment can change the output (documentation, the backlog). That script
decides whether, the workflow decides when.

## Why the wait is in GitHub Actions

Vercel bills a build by the minute, and "a CPU minute is one minute of build time multiplied by
the number of vCPU cores used" ([Vercel](https://vercel.com/docs/builds/managing-builds)). A
skipped build is still a deployment, and its billable duration is rounded up to the next minute.
So a wait inside the Ignored Build Step costs two CPU minutes per minute on this project's
two-core machine, while a whole build costs about ten. The `[skip deploy]` marker the script used
to read did exactly that: it polled the tip of `main` for up to five minutes before building. A
GitHub Actions runner on a public repository costs nothing to wait.

Measured on 2026-10-26 (Vercel Usage, 19 to 26 October): Build CPU Minutes were the largest line
of the project's bill, 17 hours and $3.58 of $11.59. Merges of different sessions minutes apart
each built the whole site: 25 October 17:43 and 18:07, 26 October 08:13 and 08:19.

## Deploying now

- A commit message containing `[deploy now]` skips the wait.
- **Actions → deploy production → Run workflow** deploys the tip of `main`; the input
  `wait_minutes` defaults to 0.
- In Vercel, **Deployments → Redeploy** on the current production deployment still works and
  does not involve the workflow.

## Setup

1. Vercel, project park.fan, **Settings → Git → Deploy Hooks**: create a hook named
   `production-debounce` for the branch `main`, and copy its URL.
2. GitHub, **Settings → Secrets and variables → Actions**: a secret
   `VERCEL_DEPLOY_HOOK_PRODUCTION` with that URL. Optionally a variable `DEPLOY_DEBOUNCE_MINUTES`.
3. Merge. The merge itself does not build; the workflow builds it ten minutes later.

Without the secret the workflow fails with an error that names it, and nothing deploys `main`.
GitHub mails the failure to whoever pushed.

## Checking it works

After a merge, the run **deploy production** shows the wait and then the hook's answer
(`{"job":{"id":…,"state":"PENDING"}}`). The Vercel deployment list shows the build as
triggered by the deploy hook, and its log starts with `ignore-build:` as before. The deploy
webhook still purges Cloudflare on `deployment.promoted`
([caching strategy](../architecture/caching-strategy.md#a-deploy-purges-cloudflare)).

If no deployment appears, the hook did not create one: revert the `git` block in `vercel.json`,
and every push to `main` builds again.

## Limits

Vercel accepts 60 deploy hook calls an hour per project. A hook call for the commit it already
deploys cancels the earlier deployment.
