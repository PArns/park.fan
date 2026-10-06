# Don't repeat yourself: one place for each piece of logic (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning and the evidence.

## The rule

- **Look before you write.** Search the [code index](../code-index/README.md) and the code for a
  helper, hook, component or constant that already does the job. Extend it rather than writing a
  second one next to it.
- **A second copy is extracted, not pasted.** Logic, a constant, a regex, a formatter, a lookup
  table or a class string that has to agree with another copy lives in one place: `lib/utils/`, the
  module that owns the subject, or the component's own file with an export. Two call sites are
  enough when the copies must agree; three when they only happen to look alike.
- **Reuse the components that exist**: [reuse existing components](reuse-existing-components.md) is
  the UI half of this rule.
- **Formatters come from `lib/utils/intl-format.ts`**, wait-time rounding from
  `lib/utils/wait-time.ts`, the API origin from `getApiBaseUrl()` in `lib/api/client.ts`. These
  were the most copied helpers in the 2026-10-06 audit.

## Where a copy is right

- The six localized content modules of a guide page (`app/[locale]/*/content/{de,en,…}.tsx`): prose
  interleaved with JSX is one module per locale by design. Shared numbers and fixtures still go into
  `_fixtures.ts`.
- Two things that look alike today but change for different reasons. Merging them couples two
  decisions that are not one.
- Test fixtures, which pin a value on purpose.

## Why

A copy is not a second implementation of the same thing for long. The first edit lands in one of
them, and from then on the two disagree without any check noticing. The audit of 2026-10-06 found
44 exact clones (2.1 % of the lines, `npx jscpd@4`) and several near-copies, and in five places the
copies had already drifted into a bug:

- The planner's day derivation was copied into the flyout and the wizard, and both copies dropped
  the `withEarlyEntry` fold, so the early-entry answer was ignored on phones and in the fit probe.
- One of five copies of the date-fns locale map had no Italian, so `/it` showed English weekdays in
  the forecast strip.
- The blog editor's two link prompts had different texts; only one mentioned `mailto:`.
- The admin role ranking existed three times, and the curated-fields tab twice, with the undo of one
  copy invalidating fewer keys than its save.
- A local copy of `formatCompact` hard-coded `'en'`, so German pages printed "1.2M".

To measure: `npx jscpd@4 app components lib --pattern "**/*.{ts,tsx}" --min-lines 12 --min-tokens 90`.
