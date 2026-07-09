# impeccable (Design Tooling)

[impeccable](https://impeccable.style) is a design-vocabulary + anti-pattern
toolkit for AI-assisted frontend work. We wire it in so it is **opt-in and
preview-scoped**: it never ships in the production bundle and never gates a
production deploy.

Two independent pieces are integrated:

1. **Detector** — a static check for AI-design anti-patterns, run on **preview
   builds** (pull requests) in CI. Non-blocking, toggleable.
2. **Annotation / live mode** — the interactive `/impeccable live` design flow
   inside the AI harness (Claude Code, Cursor …). Activated on demand, local
   only.

> Requires **Node 24+** (see [setup](setup.md)). impeccable is invoked via
> `npx`, so it is **not** a project dependency and adds nothing to the app
> bundle.

---

## 1. Detector

Scans source for the ~45 deterministic anti-patterns impeccable flags (e.g.
`side-tab` accent borders, `gradient-text`, `broken-image`). No LLM, no network.

### Locally

```bash
pnpm impeccable:detect          # human-readable, scans app/ components/ lib/
pnpm impeccable:detect:ci       # JSON output (same scope)
npx -y impeccable@3 detect app/some/file.tsx   # scope to a file/dir
```

Exit code `0` = clean, `2` = anti-patterns found.

### In CI (preview builds)

`.github/workflows/impeccable.yml` runs the detector:

- **When:** on every `pull_request` (each PR = a Vercel preview) and via manual
  `workflow_dispatch`. It **never** runs on pushes to `main`, so production
  deploys are never affected.
- **Blocking?** No. The check always succeeds; findings are posted to the job
  **summary** and uploaded as an `impeccable-report.json` artifact. To turn it
  into a hard gate later, remove `continue-on-error` from the detect step.
- **Toggle:** set the repository variable **`IMPECCABLE_DETECTOR`** to `off`
  (Settings → Secrets and variables → Actions → Variables) to disable the
  workflow without touching code. Unset or any other value = on.

### Configuration

Shared config lives in `.impeccable/config.json` (committed). Supported keys:
`detector.ignoreRules`, `detector.ignoreFiles`, `detector.ignoreValues`,
`detector.designSystem.enabled`. Per-developer overrides go in
`.impeccable/config.local.json` (gitignored).

Waive a single finding inline where it lives (travels with the file):

```text
{/* impeccable-disable-next-line broken-image -- intentional placeholder */}
<img src="" />
```

---

## 2. Annotation / live mode

The **annotation system** is impeccable's `live` command: pick an element in the
running dev server, leave a comment or stroke, and get production-quality
HTML+CSS variants hot-swapped in via HMR. It runs through the AI harness skill,
not the website — nothing is injected into the deployed app.

Activate it when you need it:

```bash
pnpm impeccable:install   # installs the impeccable skills into your AI harness
pnpm dev                  # in another terminal — live mode needs a running server
```

Then, inside Claude Code / Cursor:

```
/impeccable live          # interactive annotate → variant flow
/impeccable audit         # scored a11y / perf / theming / anti-pattern report
/impeccable critique      # UX critique with persona testing
```

Live/annotation state is written under `.impeccable/live/` and is gitignored.
Run `pnpm impeccable:update` to pull newer skills.

> The install writes into your harness dir (`.claude/skills/…` for project
> scope, or `~/.claude` for global). Project-scoped installs can be committed if
> the team wants the skills shared; otherwise keep it a per-developer opt-in.

---

## Why it is safe to leave wired in

- No runtime code, no bundle impact — it's a CLI + a harness skill.
- CI detector is non-blocking and PR-only; kill it with one repo variable.
- Annotation/live mode does nothing until a developer runs `impeccable:install`.

## Related

- [Setup](setup.md) · [Conventions](conventions.md) · [Design System](../design/design-system.md)
- Upstream: <https://impeccable.style> · `npx impeccable@3 help`
