# Voice Context

> Auto-loaded by the blog sub-skills. Last updated: 2026-10-27.
>
> The voice settings the blog skills ask for, with links. The rules are in
> [docs/writing/](docs/writing/README.md); where the two disagree, the rules are right. No
> blog-persona JSON exists for this project.

## Pronoun stance

Mixed: first person where Patrick did or thinks something, `du` for the reader in German (the other
locales follow their own convention, [§6](docs/writing/6-translation.md)).
News carries no first person and no signature ([§5.0](docs/writing/5-posts-and-news.md#50-news-posts-category-news)).

## Lexical rules

- Contractions: contract in English (`don't`, `it's`); a full form only where it carries stress
  ([§6](docs/writing/6-translation.md))
- Sentence ceiling: no word count. A sentence carries one finding and can be said in one breath
  ([§5.4](docs/writing/5-posts-and-news.md#54-blog-posts)); no colon pivot as a rhythm ([§2.7](docs/writing/2-sentence-shape.md#27-vary-the-shape))
- Paragraph ceiling: no word count; lengths must be uneven ([§2.7](docs/writing/2-sentence-shape.md#27-vary-the-shape))
- Summary label: none. No summary or key-takeaways box ([§1.5](docs/writing/1-substance.md#15-no-summary-blocks));
  the excerpt does that job, three sentences at most

## Headline patterns

- Favor: a statement that names what is under it, with its verb, in sentence case
  (`Wann Taron am kürzesten ist`); news: one fact, at most 60 characters
- Avoid: the shapes listed in [§4.3](docs/writing/4-typography.md#43-headings) and
  [§5.6](docs/writing/5-site-copy.md#56-a-heading-and-the-line-under-it)

## Voice fingerprint

0.0 is the left word, 1.0 the right.

- Funny vs serious: 0.35 (humour target and its limits: [§0.1](docs/writing/README.md#01-what-has-to-stay-when-the-slop-goes))
- Formal vs casual: 0.7
- Respectful vs irreverent: 0.35
- Enthusiastic vs matter-of-fact: 0.65 (no inflated significance, [§1.1](docs/writing/1-substance.md#11-never-inflate-significance))

## Readability target

- Audience tier: consumer
- Flesch Grade: 7 to 9
- Flesch Ease: 60 to 70 (English; the German Amstad index is not a gate here)

## Reference samples

- `content/blog/de/toverland-troy-wartezeiten-tipps.md` (tone: humour inside the paragraph, verdicts, numbers with sources)
- `content/blog/de/phantasialand-tipps.md` (tone, and the single-park chapter order of [§5.4](docs/writing/5-posts-and-news.md#54-blog-posts))
