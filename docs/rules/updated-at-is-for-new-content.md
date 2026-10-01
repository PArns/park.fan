# `updatedAt` is for new content (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the
rule in one line and links here for the reasoning.

## The rule

A post's `updatedAt` moves only when the post gets something a reader did not have before: new
dates, new parks or rides, new prices or figures, a corrected fact. The Halloween guide getting this
season's event dates and new parks is an update. Nothing else is:

- a wording pass, a fix for a rule in [docs/blog.md](../blog.md) (`rechnet durch`, an em dash, a
  colon pivot), a typo, a reflowed paragraph
- a link added, swapped or repaired, a new `ref:` card, a cover image or its caption
- a translation brought in line with the German, as long as the German itself did not get new
  content
- anything in the frontmatter but the facts

Leave the field as it is in those changes, and never add one to a post that has none. When a change
does carry new content, set `updatedAt` in every locale that got it, to the day it went live.

A news post has no `updatedAt`: a changed fact there is a dated `[!CORRECTION]` note
([a news correction is shown, never silent](a-news-correction-is-shown-never-silent.md)), and news
keeps its publication order.

## Why

`updatedAt` is not a file timestamp. It decides what the site calls new:

- **The header's blog panel** and **the homepage strips** order articles by it
  (`listArticlesByRecency`, `lastTouched` in `lib/blog/listing.ts`), and the panel prints it,
  „Aktualisiert 30. Sept. 2026“ (`navigation.updatedOn`).
- **The post's banner** shows „Aktualisiert {date}“ next to the publication date.
- **`dateModified`** in the JSON-LD and **`<lastmod>`** in the blog sitemap read it, so a crawler is
  told to come back.

On 2026-09-25 one change set `updatedAt` on 89 posts in six locales at once. From then on nearly
every guide had been "updated" on the same day, the order of the panel said nothing about which
guide had changed, and the Halloween guide, the one with this season's dates and parks, stood in a
row of guides whose text had only been reworded. On 2026-10-01 the field was taken out of every post
except the Halloween guide, and the panel went back to ordering by it and printing it.

The panel briefly ordered by publication date instead (#711). That hid the symptom and lost the
point: a guide with new content should move up. What fixes it is a field that moves only for new
content.
