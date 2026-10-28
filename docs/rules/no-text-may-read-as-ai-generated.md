# No text may read as AI-generated (REQUIREMENT)

Every string a human ever sees follows the writing rules in [docs/writing](../writing/README.md):
posts and news, UI strings, glossary definitions, `alt` and `caption`, meta titles and descriptions,
FAQ answers, empty states, the changelog, the agent skills, commit messages and PR bodies. Open the
chapters its "Which chapters to read" table names for your task.

## Why

A reader who smells a language model stops trusting the numbers next to it, and the numbers are the
product.

## Check

`pnpm check:prose` (`scripts/check-prose.mjs`) decides the half a machine can; the review pass and
the critic ([§7.2](../writing/7-review.md#72-the-review-pass)) decide the rest. Hand a text over only
after both. Frontmatter, `ref:` links and widget fences for posts:
[blog authoring guide](../../content/blog/README.md).
