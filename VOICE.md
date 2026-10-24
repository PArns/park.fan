# Voice Context

> Auto-loaded by the blog sub-skills. Last updated: 2026-10-24.
>
> A summary with links. The rules are in [docs/blog.md](docs/blog.md); where the two disagree,
> docs/blog.md is right. No blog-persona JSON exists for this project.

## Pronoun stance

Mixed: first person where Patrick did or thinks something, `du` for the reader in German (the other
locales follow their own convention, [§6](docs/blog.md#6-german-is-the-source-the-other-five-are-derived)).
News carries no first person and no signature ([§5.0](docs/blog.md#50-news-posts-category-news)).

## Lexical rules

- Contractions: full, the way people speak
- Sentence ceiling: no word count. A sentence carries one finding and can be said in one breath
  ([§5.4](docs/blog.md#54-blog-posts)); no colon pivot as a rhythm ([§2.7](docs/blog.md#27-vary-the-shape))
- Paragraph ceiling: 150 words, and lengths must be uneven ([§2.7](docs/blog.md#27-vary-the-shape))
- Summary label: none. No summary or key-takeaways box ([§1.5](docs/blog.md#15-no-summary-blocks));
  the excerpt does that job, three sentences at most

## Headline patterns

- Favor: a statement that names what is under it, a sentence with its verb, sentence case
  (`Wann Taron am kürzesten ist`). News: one fact, at most 60 characters
- Avoid: colon plus hook, „Alles, was du wissen musst", numbered listicles, slogans built from
  two mirrored halves, questions that then give an order, a figure that moves
  ([§4.3](docs/blog.md#43-headings), [§5.6](docs/blog.md#56-a-heading-and-the-line-under-it))

## Voice fingerprint

0.0 is the left word, 1.0 the right.

- Funny vs serious: 0.35 (about one smile every three or four paragraphs; news on accidents 1.0)
- Formal vs casual: 0.7
- Respectful vs irreverent: 0.35
- Enthusiastic vs matter-of-fact: 0.65 (no inflated significance, [§1.1](docs/blog.md#11-never-inflate-significance))

## Readability target

- Audience tier: consumer
- Flesch Grade: 7 to 9
- Flesch Ease: 60 to 70 (English; the German Amstad index is not a gate here)

## Reference samples

- `content/blog/de/toverland-troy-wartezeiten-tipps.md` (tone: humour inside the paragraph, verdicts, numbers with sources)
- `content/blog/de/phantasialand-tipps.md` (tone, and the single-park chapter order of [§5.4](docs/blog.md#54-blog-posts))
