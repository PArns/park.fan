/**
 * Tests for the sidecar the blog editor writes next to an uploaded image.
 *
 * Run: pnpm test:blog-image-sidecar
 *
 * The interesting part is a regex over author-written markdown, and its failure
 * mode is silence: no match means the sidecar comes out empty, the image is
 * committed anyway, and the alt text the author already typed is lost with no
 * error anywhere. So the cases that must keep working are pinned here.
 */

import { sidecarForUpload, textFromDrafts } from '../lib/admin/blog-image-sidecar.ts';

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
    console.log(`✅ ${name}`);
  } else {
    failed += 1;
    console.log(
      `❌ ${name}\n   expected ${JSON.stringify(expected)}\n   actual   ${JSON.stringify(actual)}`
    );
  }
}

const PATH = '/media/my-post/taron-queue.jpg';

console.log('\n🔎 Reading the text out of the drafts\n');

check(
  'alt only',
  textFromDrafts(PATH, { de: { body: `Vorher\n\n![Die Warteschlange](${PATH})\n\nNachher` } }),
  { alt: { de: 'Die Warteschlange' }, caption: {} }
);

check(
  'alt and caption',
  textFromDrafts(PATH, { de: { body: `![Die Warteschlange | Kurz vor der Öffnung](${PATH})` } }),
  { alt: { de: 'Die Warteschlange' }, caption: { de: 'Kurz vor der Öffnung' } }
);

check(
  'align and size segments are not caption',
  textFromDrafts(PATH, { de: { body: `![Alt | Bildtext | wide | large](${PATH})` } }),
  { alt: { de: 'Alt' }, caption: { de: 'Bildtext' } }
);

check(
  'every filled locale contributes',
  textFromDrafts(PATH, {
    de: { body: `![Warteschlange](${PATH})` },
    en: { body: `![The queue](${PATH})` },
    nl: { body: 'no image here' },
  }),
  { alt: { de: 'Warteschlange', en: 'The queue' }, caption: {} }
);

check(
  'an authoring query on the src still matches',
  textFromDrafts(PATH, { de: { body: `![Alt](${PATH}?align=wide)` } }),
  { alt: { de: 'Alt' }, caption: {} }
);

check(
  'a different image in the same body is not picked up',
  textFromDrafts(PATH, { de: { body: `![Anderes](/media/my-post/other.jpg)` } }),
  { alt: {}, caption: {} }
);

// Regex metacharacters in a path must be escaped, or `.` matches any character
// and the wrong image's alt text is attached to this one.
check(
  'the path is escaped before it becomes a pattern',
  textFromDrafts('/media/my-post/a.b.jpg', {
    de: { body: '![Wrong](/media/my-post/axbxjpg)\n![Right](/media/my-post/a.b.jpg)' },
  }),
  { alt: { de: 'Right' }, caption: {} }
);

check('an empty alt stays empty', textFromDrafts(PATH, { de: { body: `![](${PATH})` } }), {
  alt: {},
  caption: {},
});

console.log('\n🔎 The file it writes\n');

const written = JSON.parse(
  sidecarForUpload(PATH, { de: { body: `![Warteschlange | Vor der Öffnung](${PATH})` } })
);
check('tags a raster upload as a photo', written.tags, ['photo']);
check('carries the alt', written.alt, { de: 'Warteschlange' });
check('carries the caption', written.caption, { de: 'Vor der Öffnung' });
// Never invented: park, ride, focal point and author must stay unset, or the
// admin's backlog filters stop being able to find this image.
check(
  'invents no park, ride, focal point or role',
  ['park', 'ride', 'focus', 'roles'].filter((k) => k in written),
  []
);
// `license: unknown` is not an omission — it is the honest value, and it is what
// puts the image in the admin's "Rights unknown" list. What must NOT appear is an
// author, because nobody has established who took the picture.
check('rights are recorded as unknown', written.credit, { license: 'unknown' });

check(
  'tags an svg as a diagram',
  JSON.parse(sidecarForUpload('/media/my-post/throughput.svg', {})).tags,
  ['diagram']
);

check('an image nobody wrote text for still gets a row', JSON.parse(sidecarForUpload(PATH, {})), {
  tags: ['photo'],
  credit: { license: 'unknown' },
});

console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
console.log('🎉 Editor uploads describe themselves.');
