/**
 * Tests for the news export of the native app (`lib/blog/news-blocks.ts`): which posts count as
 * news and how a post body becomes blocks.
 *
 * Run: pnpm test:news-blocks
 */
import assert from 'node:assert/strict';

import { markdownToBlocks, selectNews } from '../lib/blog/news-blocks.ts';

const ctx = {
  site: 'https://park.fan/de',
  refUrl: (href) =>
    href.startsWith('ref:europa-park')
      ? `https://park.fan/de/parks/europe/germany/rust/${href.slice(4).split('?')[0]}`
      : null,
  postUrl: (slug) => (slug === 'known' ? 'https://park.fan/de/news/known' : null),
  image: (src) => (src === '/media/a/b.jpg' ? { id: 'a/b', credit: '© Foto' } : null),
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
assert.deepEqual(blocks[2], { type: 'heading', level: 2, text: 'Zeiten neu' });
assert.deepEqual(blocks[3], { type: 'list', ordered: false, items: ['Eins weiter', 'Zwei'] });
assert.deepEqual(blocks[4], { type: 'list', ordered: true, items: ['Erst', 'Dann'] });
assert.deepEqual(blocks[5], {
  type: 'link',
  text: 'Plane deine Reise',
  url: 'https://park.fan/de/orlando#planner',
});
assert.deepEqual(skipped, ['best-days-widget']);
assert.deepEqual(blocks[6], {
  type: 'quote',
  text: 'Die Worte.',
  source: 'Sprecher, [Quelle](https://example.org)',
});
assert.deepEqual(blocks[7], {
  type: 'callout',
  kind: 'parky',
  text: 'Ein Tipp.',
  date: null,
  label: 'Lohnt sich',
});
assert.deepEqual(blocks[8], {
  type: 'callout',
  kind: 'update',
  text: 'Neuer Stand.',
  date: '2026-10-22',
  label: null,
});
assert.deepEqual(blocks[9], { type: 'quote', text: 'Einfach zitiert.', source: null });
assert.deepEqual(blocks[10], {
  type: 'table',
  header: ['Tag', 'Zeit'],
  rows: [['Mo', '**9** Uhr']],
});
assert.deepEqual(blocks[11], {
  type: 'image',
  imageId: 'a/b',
  alt: 'Alt',
  caption: 'Bildunterschrift',
  credit: '© Foto',
});
assert.equal(blocks[12].url, 'https://park.fan/de/parks/europe/germany/rust/europa-park');

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

console.log('✓ news blocks');
