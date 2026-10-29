# After the post

What follows the text of a guide or a news post, in which order, and why the post's parks come
first. The page is `BlogPostPageBody` (`components/blog/blog-post-page.tsx`), shared by `/blog/[slug]`
and `/news/[slug]`. How each block's clicks are counted is in
[analytics](../development/analytics.md#internal-links-places-and-faq).

## The order

1. The tags, still inside the `<article>`.
2. The share row.
3. `#blog-progress-end`: the reading bar is full here, and `article_read` sends its 100.
4. **The post's parks and rides** (`BlogReferences`): every park and ride the post links inline,
   embeds as a widget or names in `relatedParks` / `relatedAttractions`, deduplicated, as live cards.
5. **A search field** (`SearchCommand trigger="field"`, surface `post_end`), which opens the palette
   on the hero's list ([site search](site-search.md#under-a-post)).
6. The preferred-source prompt.
7. The previous and the next post (`BlogPostNav`).
8. Further reading from the post's own section (`BlogRelatedPosts`), in a card.
9. The most read of the section (`MostReadStream`).
10. The shared bottom of an editorial page (`PageBottomSections`: nearby, favourites, featured).

The progress marker stays above the parks, so `article_read` keeps measuring the text and nothing
under it.

## Why the parks come first

The parks and rides are the one thing on the page a post cannot say by itself: whether the park is
open now, how full it is, how long the queues are. They stood at the foot of the related-posts card,
after the share row, the prompt, the previous and next post and the reading list.

From the first day and a half of the site statistic (28 and 29 October 2026):

| Entry from Google | Visits | Bounce | Ø visit |
| ----------------- | -----: | -----: | ------: |
| Crowd calendar    |     46 |   59 % |    57 s |
| Guide             |     41 |   93 % |    73 s |
| News              |     36 |   89 % |    74 s |

| `article_read` | Views | 25 % | 50 % | 75 % | 100 % |
| -------------- | ----: | ---: | ---: | ---: | ----: |
| News           |    65 |   39 |   34 |   28 |    19 |
| Guides         |    68 |   19 |    8 |    5 |   < 5 |

A guide or news reader stays more than a minute and then leaves; the calendar, which has something
to press, keeps more of them. About a third of the news views reach the end of the text, so the
parks there are seen; a guide loses most readers in its first quarter, so for a guide the end of
the page is not where a next step reaches anyone.

## The cards are live

The cards are `BlogParkCardLive` and `BlogAttractionCardLive`, the ones the inline links and the
widgets open, which lay the region batch and the park's wait times over the server-rendered
snapshot. The section used plain `ParkCard` and `AttractionCard` before, with the status of the
geo snapshot, and the page is cached at the edge for a day. The live cards share their queries with
the inline links, so a park the text links adds no request; a park named only in the frontmatter
adds its region's.
