# Park/Ride page ↔ blog link (REQUIREMENT)

Park pages list the posts about that park and ride pages the posts about that ride
(`ParkBlogPostsSection` / `AttractionBlogPostsSection` in `components/parks/blog-posts-sections.tsx`,
reverse index in `lib/blog/backlinks.ts`).

- **The relation is derived from the post itself** (references, widgets, `relatedParks` /
  `relatedAttractions`), and `parkLinks` / `rideLinks` in the frontmatter override it per post, not
  per locale. The syntax is in the
  [blog authoring guide](../../content/blog/README.md#the-other-direction-park-and-ride-pages-linking-back).
- **A derived mention ranks below every configured post** and competes for the grid's three slots,
  so a round-up that must reach every park it covers (the Halloween and winter guides) names them in
  `parkLinks`. The park page lists every configured post the grid has no room for under it
  („Weitere Guides", `getRankedPostsForPark`).
- **One guide is the park's primer**, in its own slot (`ParkFirstVisitGuide`, `getGuideForPark`),
  not a card among the posts. Only configuration decides it: a `guides` post is the primer of the
  **first** entry of its `parkLinks`, and a post listing more than `MAX_PRIMER_PARK_LINKS` (3) parks
  is nobody's primer. Tags and body references are not enough, because
  the round-ups tag a dozen parks and would become each one's first-visit guide. It is a slot, not a
  `/first-visit` URL: the guide already has one, and a second address for the same post is what
  [park sub-pages](../seo/park-sub-pages.md#the-rule-a-new-url-must-server-render-what-no-other-url-does)
  rules out.

## Check

`pnpm test:park-guide`.
