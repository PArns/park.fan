# A correction is shown, never silent (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

When a published post is changed because a fact in it was wrong, the post says so. The note is a
`> [!CORRECTION]` callout directly **under the `— Patrick` signature**, before the `---` that opens
the sources list, in every locale the fix touched. It starts with the date and names what was wrong
and what is right. Syntax and an example: [blog authoring guide, callouts](../../content/blog/README.md#callouts-and-the-correction-note).

- **News posts** are dated reports. They get the note for every changed fact, and they are not
  rewritten into a later state of the world: what happened after the post date belongs in a new
  post, not in the old one.
- **Guides and other evergreen posts** are kept current on purpose and record that through
  `updatedAt`. A fact that was _wrong_ (not merely outdated) still gets the note.
- Typos, wording, a dead link swapped for its archived copy: no note.

The box is deliberately quiet: grey, an icon, the translated label `blog.correction`, upright text.
It is not a banner at the top of the post, because a reader who came for the post should get the
post first, and a reader who saw the old version should still find what changed.

## Why

On 25 September 2026 a reader took the Parques Reunidos news apart on Facebook, and was right three
times: the post called the 2027 sister-park entries "open" although the park lists them in the 2027
season pass, it cited the 2026 Bonus Club list without the 2025 one that showed the opposite
precedent, and it named the coaster cancelled in 2012 but not Star Trek, which stands on the same
meadow. Fixing that silently would have made the reader wrong in hindsight and us unaccountable. The
correction note (#620) is what made the fix credible, and this rule makes it the default.
