/**
 * Tests for the news export of the native app (`lib/blog/news-blocks.ts`): which posts count as
 * news and how a post body becomes blocks.
 *
 * Run: pnpm test:news-blocks
 */
import assert from 'node:assert/strict';

import { markdownToBlocks, selectGuides, selectNews } from '../lib/blog/news-blocks.ts';
import { MEDIA_BASE, buildNewsExport } from './news-export.mjs';

const ctx = {
  site: 'https://park.fan/de',
  refUrl: (href) =>
    href.startsWith('ref:europa-park')
      ? `https://park.fan/de/parks/europe/germany/rust/${href.slice(4).split('?')[0]}`
      : null,
  postUrl: (slug) => (slug === 'known' ? 'https://park.fan/de/news/known' : null),
  image: (src) => (src === '/media/a/b.jpg' ? { id: 'a/b', credit: '© Foto' } : null),
  parkPath: (ref) =>
    ({
      'europa-park': 'europe/germany/rust/europa-park',
      '/parks/europe/netherlands/kaatsheuvel/efteling': 'europe/netherlands/kaatsheuvel/efteling',
    })[ref] ?? null,
  postPage: 'https://park.fan/de/news/post',
};

const md = `
Der [Europa-Park](ref:europa-park) öffnet. **Fett**, *kursiv*, <https://example.org> und [weg](ref:unknown-park).

Siehe [Beitrag](/news/known), [fehlt](/blog/missing) und [Planer](/orlando#planner).

## Zeiten \`neu\`

- Eins
  weiter
- Zwei

1. Erst
2. Dann

\`\`\`best-days-widget slug=europa-park

\`\`\`

\`\`\`ride-waits-widget rides=/parks/europe/netherlands/kaatsheuvel/efteling/baron|Baron 1898|Stahl;nowhere/x top=5

\`\`\`

\`\`\`stats-widget slug=unknown-park show=months

\`\`\`

\`\`\`stats-widget

\`\`\`

\`\`\`cta-widget
href: /orlando#planner
label: Plane deine Reise
text: Ohne Anmeldung.
\`\`\`

> [!QUOTE]
> Die Worte.
>
> [en] The words.
>
> Sprecher, [Quelle](https://example.org)

> [!PARKY] Lohnt sich
> Ein Tipp.

> [!UPDATE] 2026-10-22
> Neuer Stand.

> Einfach zitiert.

| Tag | Zeit |
| --- | ---- |
| Mo | **9** Uhr |

---

![Alt | Bildunterschrift | wide](/media/a/b.jpg)

![Fremd](/media/x/y.jpg)

[Europa-Park](ref:europa-park?full)
`;

const { blocks, skipped } = markdownToBlocks(md, ctx);
const types = blocks.map((b) => b.type);
assert.deepEqual(types, [
  'paragraph',
  'paragraph',
  'heading',
  'list',
  'list',
  'widget',
  'widget',
  'widget',
  'link',
  'quote',
  'callout',
  'callout',
  'quote',
  'table',
  'image',
  'link',
]);
assert.equal(
  blocks[0].text,
  'Der [Europa-Park](https://park.fan/de/parks/europe/germany/rust/europa-park) öffnet. **Fett**, *kursiv*, [https://example.org](https://example.org) und weg.'
);
assert.equal(
  blocks[1].text,
  'Siehe [Beitrag](https://park.fan/de/news/known), fehlt und [Planer](https://park.fan/de/orlando#planner).'
);
assert.deepEqual(blocks[2], { type: 'heading', level: 2, text: 'Zeiten neu', id: 'zeiten-neu' });
assert.deepEqual(blocks[5], {
  type: 'widget',
  widget: 'best-days',
  park: 'europe/germany/rust/europa-park',
  parkSlug: 'europa-park',
  params: {},
  url: 'https://park.fan/de/news/post',
});
assert.deepEqual(blocks[6], {
  type: 'widget',
  widget: 'ride-waits',
  park: null,
  parkSlug: null,
  rides: [
    {
      park: 'europe/netherlands/kaatsheuvel/efteling',
      parkSlug: 'efteling',
      ride: 'baron',
      label: 'Baron 1898',
    },
    { park: null, parkSlug: 'nowhere', ride: 'x', label: null },
  ],
  params: { top: '5' },
  url: 'https://park.fan/de/news/post',
});
assert.deepEqual(blocks[3], { type: 'list', ordered: false, items: ['Eins weiter', 'Zwei'] });
assert.deepEqual(blocks[4], { type: 'list', ordered: true, items: ['Erst', 'Dann'] });
assert.deepEqual(blocks[8], {
  type: 'link',
  text: 'Plane deine Reise',
  url: 'https://park.fan/de/orlando#planner',
});
assert.deepEqual(skipped, ['stats-widget']);
assert.deepEqual(blocks[7], {
  type: 'widget',
  widget: 'stats',
  park: null,
  parkSlug: 'unknown-park',
  params: { show: 'months' },
  url: 'https://park.fan/de/news/post',
});
assert.deepEqual(blocks[9], {
  type: 'quote',
  text: 'Die Worte.',
  source: 'Sprecher, [Quelle](https://example.org)',
});
assert.deepEqual(blocks[10], {
  type: 'callout',
  kind: 'parky',
  text: 'Ein Tipp.',
  date: null,
  label: 'Lohnt sich',
});
assert.deepEqual(blocks[11], {
  type: 'callout',
  kind: 'update',
  text: 'Neuer Stand.',
  date: '2026-10-22',
  label: null,
});
assert.deepEqual(blocks[12], { type: 'quote', text: 'Einfach zitiert.', source: null });
assert.deepEqual(blocks[13], {
  type: 'table',
  header: ['Tag', 'Zeit'],
  rows: [['Mo', '**9** Uhr']],
});
assert.deepEqual(blocks[14], {
  type: 'image',
  imageId: 'a/b',
  alt: 'Alt',
  caption: 'Bildunterschrift',
  credit: '© Foto',
});
assert.equal(blocks[15].url, 'https://park.fan/de/parks/europe/germany/rust/europa-park');
assert.equal(blocks[15].park, 'europe/germany/rust/europa-park');

const post = (slug, category, date, time, isFallback = false) => ({
  slug,
  isFallback,
  frontmatter: { category, date, time },
});
const picked = selectNews(
  [
    post('old', 'news', '2026-10-01', '10:00'),
    post('guide', 'guides/orlando', '2026-11-01'),
    post('sub', 'news/parks', '2026-11-02', '08:00'),
    post('fallback', 'news', '2026-11-03', '08:00', true),
    post('late', 'news', '2026-11-02', '18:00'),
  ],
  2
).map((p) => p.slug);
assert.deepEqual(picked, ['late', 'sub']);
assert.deepEqual(
  selectGuides([
    post('news', 'news', '2026-11-05', '10:00'),
    post('older', 'park-fan', '2026-10-01'),
    post('fallback', 'guides', '2026-11-03', undefined, true),
    post('guide', 'guides/orlando', '2026-11-01'),
  ]).map((p) => p.slug),
  ['guide', 'older']
);

// Every byline's avatar is a file of the bucket, and every such file is queued for upload.
const avatars = new Map();
const { files } = buildNewsExport(new Map(), avatars);
const bylines = files.filter((f) => f.json.author).map((f) => f.json.author);
assert.ok(bylines.length > 0 && avatars.size > 0);
for (const { avatar, avatarSmall } of bylines.filter((b) => b.avatar)) {
  for (const [url, width] of [
    [avatar, 192],
    [avatarSmall, 96],
  ]) {
    assert.match(url, new RegExp(`^${MEDIA_BASE}/authors/[a-z0-9-]+-[0-9a-f]{8}-${width}\\.webp$`));
    assert.equal(avatars.get(url.slice(MEDIA_BASE.length + 1))?.width, width);
  }
}

// The guides are the news shapes under another folder: same keys, same types, a `/blog/` URL.
const json = (key) => files.find((f) => f.key === key)?.json;
const shape = (value) =>
  Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'updatedAt')
      .map(([key, v]) => [key, Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v])
  );
const newsList = json('news/de.json');
const guidesList = json('guides/de.json');
assert.deepEqual(Object.keys(guidesList), Object.keys(newsList));
assert.ok(guidesList.posts.length > 0);
// A post with a cover on both sides, so `cover` and `coverAlt` compare as strings.
const newsPost = newsList.posts.find((p) => p.cover);
const guide = guidesList.posts.find((p) => p.cover);
assert.deepEqual(shape(guide), shape(newsPost));
assert.equal(guide.url, `https://park.fan/de/blog/${guide.slug}`);
assert.ok(guidesList.posts.every((p) => !p.category.startsWith('news')));
const newsBody = json(`news/de/${newsPost.slug}.json`);
const guideBody = json(`guides/de/${guide.slug}.json`);
assert.deepEqual(shape(guideBody), shape(newsBody));
assert.deepEqual(shape(guideBody.author), shape(newsBody.author));
assert.ok(guideBody.blocks.length > 0);
// A guide body holds no block type the news reader does not know.
const known = new Set(types);
for (const file of files.filter((f) => f.key.startsWith('guides/')))
  for (const b of file.json.blocks ?? []) assert.ok(known.has(b.type), `${file.key}: ${b.type}`);

console.log('✓ news blocks');
