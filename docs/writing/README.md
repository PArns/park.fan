# Writing rules

The rulebook for every text a person reads on park.fan, in all six languages: posts and news, UI
strings, `alt` and `caption`, meta titles and descriptions, glossary definitions, landing and
guide pages, empty states, error messages, push bodies, the feeds, the changelog, and commits,
PRs and tickets. Read §0 below before writing any of them, then the chapters the table names for
your task.

It exists for one requirement in [`CLAUDE.md`](../../CLAUDE.md): **no text on this site may read
as AI-generated.** A reader who smells a language model stops trusting the numbers next to it, and
the numbers are the product. A model "tends to regress to the mean", in Wikipedia's words, and its
output drifts towards "the prose of a travel guide". A theme-park site is a travel guide, so every
rule here is a way of putting back the specific fact that the average sentence replaced. The rules
come from the editors' field guides and the linguistics behind them ([sources](sources.md)),
researched for German and English first, and from reviews of our own shipped text.

`scripts/check-prose.mjs` (`pnpm check:prose`) is the executable half. A rule and its check change
together ([§7](7-review.md)).

## Which chapters to read

| You are about to …                                   | Read                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| write anything                                       | [§0](#0-read-this-before-you-start-deleting-words), then the house rules in [§3.3](3-vocabulary.md#33-ours-and-non-negotiable)            |
| write a post or a guide                              | [§0.1](#01-what-has-to-stay-when-the-slop-goes), §1 to §4, [§5.4](5-posts-and-news.md#54-blog-posts), §6, §7                              |
| write a news post                                    | the same, plus [§5.0](5-posts-and-news.md#50-news-posts-category-news)                                                                    |
| write a post from our own data                       | [§2.19](2-sentence-shape.md#219-the-database-instead-of-the-park), [§3.3 rule 23](3-vocabulary.md#33-ours-and-non-negotiable)             |
| state a figure, a spec or a source                   | [§1.2](1-substance.md#12-every-claim-carries-its-evidence-or-it-goes)                                                                     |
| write a heading or a title                           | [§4.3](4-typography.md#43-headings), [§5.6](5-site-copy.md#56-a-heading-and-the-line-under-it)                                            |
| write a UI string or an FAQ answer                   | [§5.1](5-site-copy.md#51-ui-strings-messagesjson), [§5.6](5-site-copy.md#56-a-heading-and-the-line-under-it)                              |
| write `alt` or `caption`                             | [§5.2](5-site-copy.md#52-alt-and-caption-media-sidecars); the sidecar format is in [public/media/README.md](../../public/media/README.md) |
| write a meta title, a description or template copy   | [§5.3](5-site-copy.md#53-meta-titles-descriptions-and-template-copy), the excerpt rules in [§5.4](5-posts-and-news.md#54-blog-posts)      |
| write `llms.txt`, a skill or a tool description      | [§5.5](5-site-copy.md#55-machine-facing-text)                                                                                             |
| write a glossary definition                          | [§5.7](5-site-copy.md#57-the-glossary-contentglossaryts)                                                                                  |
| write a changelog entry                              | [§5.8](5-site-copy.md#58-the-public-changelog-contentchangelog)                                                                           |
| write a commit, a PR, a ticket or a code comment     | [§5.9](5-9-commits-and-tickets.md)                                                                                                        |
| translate                                            | [§6](6-translation.md)                                                                                                                    |
| hand a text over                                     | [§7](7-review.md): `pnpm check:prose`, then the review pass and the critic ([§7.2](7-review.md#72-the-review-pass))                       |
| read a guide the way the critic does, or add a check | [§2.20](2-20-check-patterns.md), [§7.2](7-review.md#72-the-review-pass)                                                                   |

Post syntax (frontmatter, `ref:` links, widget fences, callouts, quotes) is in the
[blog authoring guide](../../content/blog/README.md); message keys are added per
[translations](../i18n/translations.md).

### Where each section lives

A `§` number in these pages, in a `check:prose` message or in a code comment is a section of this
rulebook. The file name starts with the chapter number:

- §0: this page
- §1: [1-substance.md](1-substance.md)
- §2.1 to §2.19: [2-sentence-shape.md](2-sentence-shape.md); §2.20, the patterns `check:prose`
  knows by name: [2-20-check-patterns.md](2-20-check-patterns.md)
- §3: [3-vocabulary.md](3-vocabulary.md)
- §4: [4-typography.md](4-typography.md)
- §5.0 and §5.4: [5-posts-and-news.md](5-posts-and-news.md); §5.1 to §5.3 and §5.5 to §5.8:
  [5-site-copy.md](5-site-copy.md); §5.9: [5-9-commits-and-tickets.md](5-9-commits-and-tickets.md)
- §6: [6-translation.md](6-translation.md)
- §7: [7-review.md](7-review.md)
- the literature: [sources.md](sources.md)

## 0. Read this before you start deleting words

**This is a writing guide, not a detection guide.** Detectors have real error rates, and people
asked to sort AI text from human text do close to chance. Never call a text generated because it
trips one item here. A single sign is noise; a text is in trouble when several land in the same
passage.

**Some signs are strong enough alone** (the split follows the humanizer ruleset) and are fixed on
sight: the aphoristic closer (§2.8), `nicht X, sondern Y` at the edge of a section (§2.1), an
honesty or authenticity claim (§3.3), an invented detail or a placeholder (§1.8), a disclaimer
that names nobody (§1.9), a heading that asks and then gives an order (§5.6). Everything else is
**weak**: a transition word, a triad, a short sentence, a rhetorical question. A weak sign matters
only when several sit together. The em dash is banned as house style, not as a tell (§4.1).

**Over-correction is its own failure.** None of these is a tell; do not mangle a text to dodge
them:

- Perfect grammar. Plenty of people write clean prose; never add errors to look human.
- A formal register. The correlation is with specific words, not with formality.
- One transition word (`Außerdem`, `Additionally`). The mechanical repetition is the tell.
- A three-part list. One per section is rhetoric; three per section is a tic.
- Casual and formal registers mixed. That is how many people write.

The rule of thumb under everything else: **generated prose is confident, even and empty.** Human
prose has uneven paragraphs, an opinion, a number somebody had to look up, and at least one thing
the writer noticed that nobody asked for.

### 0.1 What has to stay when the slop goes

Nearly every rule here takes something out, and applied alone they take the jokes out with the
slop: a pass over every post in September 2026 came back correct and flat, and Patrick's answer
was „die Beiträge sollen sich mit Humor lesen, nicht langweilig“. Four things are goals of their
own. A pass that removes one has over-corrected.

**The bar.** A post is done when a person enjoys reading it and every number in it is right. A
green `pnpm check:prose` is the floor, not the finish.

**Humour.** About one smile every three or four paragraphs of a post, most of them in the intro
and at the start of a chapter, and inside a paragraph rather than at its end (the wink budget of
§2.17 counts last sentences). What works: understatement, an everyday comparison that claims no
measurement, self-irony, the reader's real situation, a callback to something earlier in the
post. Two lines to calibrate against: „eher ein Hörspiel mit Selbstbedienung“ and „ungefähr so
verbindlich wie ein Neujahrsvorsatz“. A heading may be funny as long as it still names what is
under it (§4.3). Still banned: the pun for its own sake, the exclamation mark, the emoji, the
maxim at the end of a section (§2.8), the wink at the end of every paragraph (§2.17), a comparison
that pretends to be a measurement (§1.8). Keep the joke that carries a fact; cut the one that only
decorates.

Not every text has a place for one. A news post about an accident, an injury, a lawsuit or a
death carries none. UI strings, meta descriptions, `alt` texts and commit messages have no humour
target; a caption may carry one joke (§5.2). A joke is not translated word for word: each locale
writes its own or keeps the fact plainly (§6).

**Voice.** First person where Patrick did or thinks something, `du` for the reader, a verdict
where the reader wants one (§1.3). Read for tone, not to copy chapter by chapter:
`content/blog/de/toverland-troy-wartezeiten-tipps.md` and `content/blog/de/phantasialand-tipps.md`.

**Length.** Patrick does not want short posts. The floors, counted with `wc -w` over the German
file below the frontmatter (a table or a widget counts, so one added to reach the floor is padding
like any other):

- single-park guide: ~4,000 words
- overview, ranking, multi-park or season guide: ~3,500 words
- behind the scenes, posts about park.fan: ~1,500 words
- news: ~400 words

The floor applies when the ticket does not mention one; an update to an existing post has none.
Length comes from facts the reader needs (a number, a name, a date, a widget, a ride the post
skipped), never from a second pass over the same facts (§5.4), an intro to the intro or a closing
summary (§1.5). When the material runs out, nobody pads: the PR says
`Länge: <n> Wörter, Untergrenze <n>, es fehlt: <was>` and Patrick decides. The critic (§7.2)
rewrites a weak sentence rather than cutting it, so a review never pushes a post under its floor.
