// The Halloween-maze group on the park page: built only when the park has a MAZE, ordered after
// the lands and before the land-less bucket, and absent without a `mazeName`.
import { groupAttractionsByLand, sortLandNames } from '../lib/utils/park-utils.ts';
import { checkThat, finishChecks } from './lib/run-cases.mjs';

const ride = (name, land) => ({ name, land, attractionKind: 'RIDE' });
const maze = (name, land) => ({ name, land, attractionKind: 'MAZE' });
const names = (g, k) => (g[k] ?? []).map((a) => a.name);

const none = groupAttractionsByLand([ride('A', 'X'), ride('B')], 'Other', 'Mazes');
checkThat('no maze, no group', !('Mazes' in none) && Object.keys(none).length === 2);

const withLand = groupAttractionsByLand([ride('A', 'X'), maze('M', 'X')], 'Other', 'Mazes');
checkThat(
  'a maze with a land leaves it',
  names(withLand, 'X').join() === 'A' && names(withLand, 'Mazes').join() === 'M'
);

const noLand = groupAttractionsByLand([maze('M')], 'Other', 'Mazes');
checkThat(
  'a maze without a land joins the group, not the fallback',
  'Mazes' in noLand && !('Other' in noLand)
);

const only = groupAttractionsByLand([maze('B'), maze('A')], 'Other', 'Mazes');
checkThat(
  'only mazes: one group, sorted by name',
  Object.keys(only).join() === 'Mazes' && names(only, 'Mazes').join() === 'A,B'
);

const mixed = groupAttractionsByLand([maze('M', 'Z'), ride('A', 'Y'), ride('C')], 'Other', 'Mazes');
checkThat(
  'order: lands, mazes, land-less',
  sortLandNames(Object.keys(mixed), 'Other', 'Mazes').join() === 'Y,Mazes,Other'
);

const legacy = groupAttractionsByLand([maze('M', 'X')], 'Other');
checkThat('without mazeName the old grouping holds', Object.keys(legacy).join() === 'X');
checkThat(
  'sortLandNames without mazeName is alphabetical, fallback last',
  sortLandNames(['Other', 'B', 'A'], 'Other').join() === 'A,B,Other'
);

finishChecks();
