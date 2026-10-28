# impeccable (design tooling)

[impeccable](https://impeccable.style) is a design anti-pattern detector plus an AI-harness skill
for annotating the running app. Open this page to run the detector, read its CI report, or start a
live annotation session. It runs through `npx` (`impeccable@3`), so it is not a project dependency
and nothing of it reaches the app bundle.

## Detector

A static scan for ~45 deterministic anti-patterns (`side-tab` accent borders, `gradient-text`,
`broken-image`, …). No LLM, no network.

```bash
pnpm impeccable:detect              # human-readable, scans app/ components/ lib/
pnpm impeccable:detect:ci           # JSON, same scope
npx -y impeccable@3 detect app/some/file.tsx
```

Exit code `0` is clean, `2` means findings.

**In CI**, `.github/workflows/impeccable.yml` runs it on every pull request and on manual dispatch,
never on pushes to `main`. It is non-blocking (`continue-on-error` on the detect step): findings go
to the job summary and an `impeccable-report.json` artifact. Setting the repository variable
`IMPECCABLE_DETECTOR` to `off` disables the workflow; removing `continue-on-error` would make it a
gate.

**Configuration** is `.impeccable/config.json` (committed: `detector.ignoreRules`,
`detector.ignoreFiles`, `detector.ignoreValues`, `detector.designSystem.enabled`), with
per-developer overrides in the git-ignored `.impeccable/config.local.json`. Waive one finding where
it lives:

```text
{/* impeccable-disable-next-line broken-image -- intentional placeholder */}
<img src="" />
```

## Live annotation

`/impeccable live` in Claude Code or Cursor lets you pick an element in the running dev server,
comment or draw on it, and get HTML+CSS variants hot-swapped in through HMR. The overlay attaches
only while a harness session runs that command (it starts a local helper, injects the overlay
script with a per-session port and token, and long-polls for annotations); nothing is injected
into a deployed app.

```bash
pnpm impeccable:install   # once: installs the skills into your harness (.claude/skills/ or ~/.claude)
pnpm dev:live             # pnpm dev plus instructions for attaching the overlay
pnpm impeccable:update    # newer skills
```

Then, in the harness: `/impeccable live`, `/impeccable audit` (scored a11y, performance, theming
and anti-pattern report) or `/impeccable critique`. Session state goes to the git-ignored
`.impeccable/live/`.
