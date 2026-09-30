# No text may read as AI-generated (REQUIREMENT)

One standing rule, indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md). It covers every string a human ever sees: posts, UI strings, glossary definitions, `alt` and `caption`, meta titles and descriptions, FAQ answers, empty states, the changelog, the agent skills, commit messages and PR bodies.

**The rules live in one place: [docs/blog.md](../blog.md).** This page only says where to look. `scripts/check-prose.mjs` is its executable twin (§7).

| You are about to …                     | Open                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| write anything                         | [§0](../blog.md#0-read-this-before-you-start-deleting-words), then the house rules in [§3.3](../blog.md#33-ours-and-non-negotiable) |
| check whether a sentence says anything | [§1.7](../blog.md#17-the-sentence-that-claims-nothing)                                                                              |
| end a paragraph, a section or a post   | [§2.8](../blog.md#28-the-aphoristic-closer), [§2.17](../blog.md#217-the-wink)                                                       |
| write about a park, a ride or an event | [§3.4](../blog.md#34-travel-guide-copy-in-all-six-languages)                                                                        |
| write a heading or a title             | [§4.3](../blog.md#43-headings), [§5.6](../blog.md#56-a-heading-and-the-line-under-it)                                               |
| write a news post                      | [§5.0](../blog.md#50-news-posts-category-news)                                                                                      |
| write a UI string or an FAQ answer     | [§5.1](../blog.md#51-ui-strings-messagesjson)                                                                                       |
| write `alt` or `caption`               | [§5.2](../blog.md#52-alt-and-caption-media-sidecars), [public/media/README.md](../../public/media/README.md)                        |
| write a glossary definition            | [§5.7](../blog.md#57-the-glossary-contentglossaryts)                                                                                |
| translate                              | [§6](../blog.md#6-german-is-the-source-the-other-five-are-derived)                                                                  |
| hand a text over                       | `pnpm check:prose` ([§7](../blog.md#7-the-check-before-you-publish)), then the review pass ([§7.2](../blog.md#72-the-review-pass))  |

Frontmatter, `ref:` links and widget fences for posts: [blog authoring guide](../../content/blog/README.md).
