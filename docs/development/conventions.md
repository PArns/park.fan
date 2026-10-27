# Conventions

Project conventions that are not standing rules, and two traps in the toolchain. Open it before
using `asChild` in a server component, before running `pnpm format` on a red Markdown file, or
when building a three.js scene. The standing rules are in [`docs/rules/`](../rules/README.md).

## Where each convention is written down

| Convention                                                                                            | Owner                                                                                  |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Link to an API entity with `convertApiUrlToFrontendUrl()` or the geo builders, never by string splits | [routing and URLs](../architecture/routing-and-urls.md#url-conversion-api--frontend)   |
| "Today" and schedule dates come from the park's timezone, compared as `YYYY-MM-DD`                    | [date and time handling](datetime-handling.md)                                         |
| Every UI string is in `messages/*.json`, in all six locales                                           | [translations](../i18n/translations.md)                                                |
| Search goes through `/api/search` and starts at three characters                                      | `app/api/search/route.ts`, `lib/hooks/use-search-results.ts`                           |
| Favorites live in a cookie, enriched through `/api/favorites`                                         | [backend integration](../api/backend-integration.md#favorites)                         |
| The API's `moderate` is shown as "Normal"; `unknown` is not a tier                                    | [backend integration](../api/backend-integration.md#crowd-levels)                      |
| A calendar day is `OPERATING`, `CLOSED` or `UNKNOWN`, and `UNKNOWN` is not "closed"                   | [calendar status](../api/calendar-status-closed.md)                                    |
| Experiments are build-time `NEXT_PUBLIC_*` flags; debug overrides are `?sim=` and `?state=`           | [flags and debug](flags-and-debug.md)                                                  |
| Reuse `ParkStatusBadge`, `CrowdLevelBadge`, `Badge`, `ParkCard` and the rest                          | [reuse existing components](../rules/reuse-existing-components.md)                     |
| `Intl` formatters come from `lib/utils/intl-format.ts`, never one per item                            | [a render redoes no work](../rules/a-render-redoes-no-work.md)                         |
| A °C/°F or other client-only preference never branches server-rendered markup                         | [the rule](../rules/a-client-only-preference-may-not-decide-server-rendered-markup.md) |

Secrets and API keys live in `.env.local` and the Vercel environment only, never in the repo or
in a doc.

## Never `asChild` a client element from a server component

A Radix `asChild` trigger (`TooltipTrigger`, `HoverCardTrigger`, `Button asChild`, …) hands its
child to `Slot`, which needs a **single React element**. From a server component, a client
component such as `next/link` arrives as a **lazy client reference**. `Slot` unwraps it only while
the payload is still pending; once an earlier instance on the page has resolved the chunk, it
throws `Primitive.button failed to slot onto its children` and takes the client tree into the
error boundary. So it fails **by page length**: a long blog post resolves the chunk before the
first tooltip and crashes every time, the same content cut in half renders fine.

```tsx
// ✗ server component
<TooltipTrigger asChild>
  <Link href={href}>{text}</Link>
</TooltipTrigger>
// ✓ move the whole wrapper into a client component (components/glossary/glossary-inject-term.tsx)
```

For a link that looks like a **button** or a **badge**, spread `buttonLinkProps`
(`components/ui/button.tsx`) or `badgeLinkProps` (`components/ui/badge.tsx`) onto the link. Each
returns exactly the props its component applies (`data-slot`, `data-variant`, `data-size`, the
class string), so the markup is byte-identical and no `Slot` is involved:

```tsx
<Link
  href="/parks"
  {...buttonLinkProps({ variant: 'outline', size: 'sm', className: 'rounded-full' })}
>
  {label}
</Link>
```

Still fine: `asChild` inside a client component (no lazy reference inside one client boundary),
and slotting a **host** element (`<Badge asChild><a href=…>` in `rcdb-badge.tsx`) or a component
that is itself server-executable, such as `Button` inside a `TooltipTrigger` on the `/ui` page.

## Prettier on Markdown: two cases where `format` is the cause

`pnpm format:check` covers `docs/**` and `content/**`. On Markdown, Prettier rewrites source in
two ways that change what a reader gets, so **when `format:check` names a Markdown file, read the
diff `pnpm format` produces before committing it.** For every other file type `--write` is the
answer.

### Angle brackets around a link destination

A destination with **unbalanced** parentheses is a link only inside `<…>`. Prettier (3.9.10,
checked) removes the brackets:

<!-- The fence below is `text`, not `markdown`: Prettier formats fenced Markdown too, and in a
     `markdown` fence it eats the very brackets this example is about. -->

```text
before:  [Vorteile 2026 (PDF)](<https://www.movieparkgermany.de/…/-(bonusclub(/….pdf>)
after:   [Vorteile 2026 (PDF)](https://www.movieparkgermany.de/…/-(bonusclub(/….pdf)
```

The result is no longer a link for `remark-parse` + `remark-gfm`: the address is autolinked with a
closing parenthesis appended (a 404) and the bracket text shows on the page. **Percent-encode the
parentheses** (`%28` / `%29`); Prettier then leaves the address alone. A backslash escape is
removed just as readily, and a reference definition never reaches its use, because a post body is
split into one `<ReactMarkdown>` per widget fence. (`(bonusclub(` is the operator's real path.)

### A paragraph indented under `- [ ]`

`- [ ] ` puts its content at column 2 by CommonMark, but Prettier aligns list content with the
checkbox, at column 6. When the item's first paragraph wraps (continuation lines at column 6) and a
**second** paragraph is aligned with them, Prettier reads it as an indented code block, prints it
four columns deeper and never converges: 6, 10, 14, 18 columns on four runs, `--check` red after
each. **Put the paragraph on column 2.** This is the one case where a red `format:check` survives
`pnpm format`, so a loop that "just runs format again" never ends.

## three.js scenes

The rule, the coaster engine's files and the contact-sheet script are in
[three.js animations](../rules/threejs-animations.md).
