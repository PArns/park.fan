/**
 * Unit tests for `lib/media/session-photos.ts` — what the open media session
 * already holds for a park, and how the capture screen uses it.
 *
 * The backlog was built from the media index, which is built from `main`. A
 * photo taken this morning sits in the session's draft pull request, so after a
 * reload every ride photographed today was listed under "Fehlt noch" again, and
 * the next photo of it got the first one's name. Measured on 2026-09-27 against
 * the open session PR #627 at Phantasialand: 12 sidecars, all 12 readable from
 * their patches, 10 rides none of which `main` covers, and 12 file names the
 * backlog did not know. The fixtures below are that pull request's file list,
 * trimmed.
 *
 * The last block greps the route and the upload hook, because what matters there
 * is that the answer is used, which a unit test of the pure functions cannot see.
 *
 * Run: `pnpm test:capture-session`
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  mediaPath,
  ridesInSidecars,
  sessionNames,
  sessionSidecars,
  sidecarFromPatch,
} from '../lib/media/session-photos.ts';

let checked = 0;
const check = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  checked += 1;
};

/** A sidecar as `pulls.listFiles` sends an added one: the whole file, one hunk. */
const addedPatch = (sidecar) => {
  const lines = JSON.stringify(sidecar, null, 2).split('\n');
  return [`@@ -0,0 +1,${lines.length} @@`, ...lines.map((line) => `+${line}`)].join('\n');
};

const AVORAS = {
  park: 'phantasialand',
  ride: 'avoras',
  area: 'Fantasy',
  tags: ['day', 'photo', 'ride'],
  shotAt: '2026-09-27',
  review: true,
};

/** `GET /repos/PArns/park.fan/pulls/627/files`, trimmed. */
const FILES = [
  { filename: 'public/media/phantasialand/avoras.jpg', status: 'added' },
  {
    filename: 'public/media/phantasialand/avoras.json',
    status: 'added',
    patch: addedPatch(AVORAS),
  },
  { filename: 'public/media/phantasialand/wellenflug.jpg', status: 'added' },
  {
    filename: 'public/media/phantasialand/wellenflug.json',
    status: 'added',
    patch: addedPatch({ park: 'phantasialand', ride: 'wellenflug' }),
  },
  { filename: 'public/media/phantasialand/wellenflug-2.jpg', status: 'added' },
  {
    filename: 'public/media/phantasialand/wellenflug-2.json',
    status: 'added',
    patch: addedPatch({ park: 'phantasialand', ride: 'wellenflug' }),
  },
];

// --- paths ------------------------------------------------------------------

check(
  mediaPath('public/media/phantasialand/wellenflug-2.jpg'),
  { collection: 'phantasialand', name: 'wellenflug-2', ext: 'jpg' },
  'a media path splits into collection, name and extension'
);
check(
  mediaPath('public/media/toverland/halloween/troy.JSON'),
  { collection: 'toverland/halloween', name: 'troy', ext: 'json' },
  'a nested collection keeps its slash, and the extension is compared lower-case'
);
for (const path of [
  'content/blog/de/post.md',
  'public/media/loose.jpg',
  'public/media/phantasialand/README',
]) {
  check(mediaPath(path), null, `${path} is not a media file`);
}

// --- names ------------------------------------------------------------------

check(
  sessionNames(FILES, 'phantasialand').sort(),
  ['avoras', 'wellenflug', 'wellenflug-2'],
  'image and sidecar share one name, and each counts once'
);
check(
  sessionNames(
    [
      ...FILES,
      { filename: 'public/media/phantasialand/old.jpg', status: 'removed' },
      { filename: 'public/media/phantasialand-halloween/avoras-night.jpg', status: 'added' },
      { filename: 'public/media/toverland/troy.jpg', status: 'added' },
    ],
    'phantasialand'
  ).sort(),
  ['avoras', 'wellenflug', 'wellenflug-2'],
  'a removed file adds nothing, and another collection cannot collide with this one'
);

// --- sidecars ---------------------------------------------------------------

check(
  sessionSidecars([
    ...FILES,
    { filename: 'public/media/phantasialand/gone.json', status: 'removed' },
    { filename: 'content/blog/de/post.json', status: 'added' },
  ]).map((file) => file.filename),
  [
    'public/media/phantasialand/avoras.json',
    'public/media/phantasialand/wellenflug.json',
    'public/media/phantasialand/wellenflug-2.json',
  ],
  'only sidecars under public/media that survive the merge are read'
);

check(sidecarFromPatch(addedPatch(AVORAS)), AVORAS, 'an added sidecar is read whole off its patch');
check(
  sidecarFromPatch(`${addedPatch(AVORAS)}\n\\ No newline at end of file`),
  AVORAS,
  'the no-newline marker is not part of the file'
);
for (const [patch, why] of [
  [undefined, 'a patch GitHub left out'],
  ['@@ -3,7 +3,7 @@\n   "ride": "avoras",\n-  "tags": []\n+  "tags": ["day"]', 'a changed sidecar'],
  ['@@ -0,0 +1,2 @@\n+{\n+  "park": ', 'a patch that is not valid JSON'],
]) {
  check(sidecarFromPatch(patch), null, `${why} is not read from the patch`);
}

// --- rides ------------------------------------------------------------------

check(
  [
    ...ridesInSidecars(
      FILES.filter((file) => file.patch).map((file) => sidecarFromPatch(file.patch)),
      'phantasialand'
    ),
  ].sort(),
  ['avoras', 'wellenflug'],
  'the rides come out of the sidecars, each once'
);
check(
  [
    ...ridesInSidecars(
      [
        { park: 'phantasialand', ride: 'winjas-fear', alsoRides: ['winjas-force'] },
        { park: 'toverland', ride: 'troy' },
        { park: 'phantasialand', ride: null },
        { ride: 'taron' },
        null,
        'not a sidecar',
      ],
      'phantasialand'
    ),
  ].sort(),
  ['winjas-fear', 'winjas-force'],
  'alsoRides counts, another park does not, and a sidecar without a park names nothing'
);

// --- used where it matters --------------------------------------------------

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const route = read('../app/api/admin/media/backlog/route.ts');
const uploads = read('../app/admin/capture/_lib/use-capture-uploads.ts');

const grep = (source, pattern, message) => {
  assert.match(source, pattern, message);
  checked += 1;
};
const absent = (source, pattern, message) => {
  assert.doesNotMatch(source, pattern, message);
  checked += 1;
};

grep(
  route,
  /hasPhoto: inSession \|\| getRideImages\(/,
  'a ride photographed in the open session counts as photographed'
);
grep(
  route,
  /\.\.\.\(session\?\.names \?\? \[\]\)/,
  "the session's file names are taken, or the next photo is named after the one in the PR"
);
grep(
  route,
  /sessionPhotos\(parkSlug\)\.catch\(\(\) => null\)/,
  'a GitHub failure costs the session half of the answer, not the backlog'
);
absent(
  uploads,
  /taken\.current = new Set\(/,
  'a backlog refetch must not replace the names reserved for photos still uploading or queued'
);
grep(
  uploads,
  /for \(const photo of queued\) namesIn\(taken\.current, photo\.collection\)\.add\(photo\.name\)/,
  'photos waiting in the queue keep their names across a reload'
);

console.log(`capture session: ${checked} checks passed`);
