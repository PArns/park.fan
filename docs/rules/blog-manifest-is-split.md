# Blog manifest is split (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

the generator writes `manifest.ts` (frontmatter + build-time derivations, small) and `manifest-bodies.ts` (~900 KB of markdown). Galleries are no longer its job — they come from the media database. Import listings from **`@/lib/blog/listing`** — `@/lib/blog` drags every post body into that route's bundle, and it is imported by the root layout, the homepage and every park page. Body-derived values (reading time, `parkRefs`) are computed at build time by the shared `lib/blog/derive.mjs`, never a second copy of those regexes. See [scripts](docs/development/scripts.md#the-blog-manifest-is-three-files-on-purpose).
