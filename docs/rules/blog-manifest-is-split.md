# Blog manifest is split (REQUIREMENT)

Import listings from **`@/lib/blog/listing`**, never from `@/lib/blog`. `scripts/generate-blog-manifest.mjs`
writes three git-ignored modules: `lib/blog/manifest.ts` (frontmatter plus build-time derivations,
small), `lib/blog/manifest-bodies.ts` (the markdown, ~900 KB) and `lib/blog/news-redirects.ts` (for
`proxy.ts`). `@/lib/blog` imports the bodies, so importing it from a listing drags every post body
into that route's bundle, and listings are imported by the root layout, the homepage and every park
page. Only the post page reads `@/lib/blog`.

Body-derived values (reading time, `parkRefs`, the latest `[!UPDATE]` date) are computed at build
time by the shared `lib/blog/derive.mjs`, never by a second copy of those regexes. Galleries come
from the media database, not from the manifest.

Background: [scripts → the blog manifest is three files](../development/scripts.md#the-blog-manifest-is-three-files-on-purpose).
