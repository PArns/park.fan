/**
 * Tests for repointing blog references when an image moves.
 *
 * Run: pnpm test:media-references
 *
 * Moving an image renames the file, so a post that still names the old path
 * renders a 404. The rewrite that prevents that is a regex over article markdown,
 * and both of its failure modes are quiet: rewriting too little leaves a broken
 * image, rewriting too much repoints a DIFFERENT picture at the moved one, and
 * neither produces an error.
 */

import { postFilePath, rewriteReferences } from '../lib/admin/media-references.ts';

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

const FROM = { collection: 'my-post', name: 'taron' };
const TO = { collection: 'phantasialand', name: 'taron', ext: 'jpg' };

console.log('\n🔎 Rewriting\n');

check('a markdown image moves', rewriteReferences('![Alt](/media/my-post/taron.jpg)', FROM, TO), {
  body: '![Alt](/media/phantasialand/taron.jpg)',
  changed: 1,
});

check(
  'a crop moves with the source',
  rewriteReferences('- /media/my-post/taron-16x9.jpg | Alt', FROM, TO),
  { body: '- /media/phantasialand/taron-16x9.jpg | Alt', changed: 1 }
);

check(
  'frontmatter and body in one pass',
  rewriteReferences(
    'src: /media/my-post/taron-4x3.jpg\n\n![A](/media/my-post/taron.jpg)',
    FROM,
    TO
  ),
  {
    body: 'src: /media/phantasialand/taron-4x3.jpg\n\n![A](/media/phantasialand/taron.jpg)',
    changed: 2,
  }
);

// A move can be a replace at the same time: a PNG swapped for a JPEG lands under a
// new extension, and a reference left at `.png` 404s just as hard as a stale folder.
check(
  'the destination extension wins',
  rewriteReferences('![A](/media/my-post/taron.png)', FROM, TO),
  { body: '![A](/media/phantasialand/taron.jpg)', changed: 1 }
);

check(
  'a different image in the same post is left alone',
  rewriteReferences('![A](/media/my-post/black-mamba.jpg)', FROM, TO),
  { body: '![A](/media/my-post/black-mamba.jpg)', changed: 0 }
);

// The dangerous near-miss: `taron-queue` starts with `taron`, and a pattern without
// a boundary would rewrite it and point two different photos at one file.
check(
  'a longer name that merely starts the same is not touched',
  rewriteReferences('![A](/media/my-post/taron-queue.jpg)', FROM, TO),
  { body: '![A](/media/my-post/taron-queue.jpg)', changed: 0 }
);

check(
  'same name in another collection is not touched',
  rewriteReferences('![A](/media/other/taron.jpg)', FROM, TO),
  { body: '![A](/media/other/taron.jpg)', changed: 0 }
);

check(
  'a post with no reference reports nothing changed',
  rewriteReferences('no images', FROM, TO),
  {
    body: 'no images',
    changed: 0,
  }
);

console.log('\n🔎 Post paths\n');

check(
  'post key maps to its file',
  postFilePath('de/phantasialand-tipps'),
  'content/blog/de/phantasialand-tipps.md'
);

console.log(`\n📊 ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
console.log('🎉 Moving an image takes its references with it.');
