# A comment says why, once, and nothing that can go stale (REQUIREMENT)

A comment holds what the code cannot say for itself, in one to three sentences, or a link to the
page that holds it. Nothing checks a comment: `tsc`, the tests and the build read the code, and a
comment that stopped being true compiles as well as one that is. Every sentence in a comment is a
sentence somebody has to keep true by hand.

## What a comment is for

- **A reason the code cannot show:** why this and not the obvious alternative, a constraint from
  outside (the API, a browser, a crawler), a trap the next person would walk into.
- **The purpose of an export**, in one sentence, as its `/** … */` doc comment. That sentence is its
  entry in the [code index](../code-index/README.md)
  ([the code index rule](the-code-index-is-generated-from-the-doc-comments.md)).
- **A pointer** to the page that holds the full reasoning: `docs/rules/…`, `docs/features/…`. The
  page is read by the sessions that need it; the comment by everyone who opens the file.

## What a comment is not for

| Leave out                                                            | Because                                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| What the next line does (`// Memoised`, `// Fetch the park`)         | The line says it, and the two drift apart at the first edit                |
| JSX section labels (`{/* Header */}`, `{/* Content */}`)             | The markup is the label                                                    |
| Section banners (`// ======== Component ========`)                   | A file that needs signposts needs splitting                                |
| The history of the code ("used to", "moved from", "before PAR-123")  | That is what `git log` and `git blame` are for                             |
| Ticket numbers, dates and measurements                               | They are true on the day they were written; keep them where they are dated |
| A rule's full reasoning when a `docs/rules/` page holds it           | Two copies drift; link the page                                            |
| The signature again (`@param id the id`), the props again, the steps | The types and the body already say it                                      |
| Commented-out code                                                   | It is in the history                                                       |
| A name that no longer exists in the code                             | It sends the reader looking for something that is gone                     |

A number may stay when it **is** the reason (`// 13, not 15: Disney's walk-on, see WALK_ON_WAIT_MINUTES`).
A measurement that justifies a design goes into the rule or feature page with its date, and the
comment links that page. What changed and why goes into the commit message and the pull request;
what shipped goes into the changelog fragment.
