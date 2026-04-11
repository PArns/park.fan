import { performance } from 'node:perf_hooks';

const generateMockResults = (count) => {
  const types = ['location', 'park', 'attraction', 'show', 'restaurant'];
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push({
      type: types[i % types.length],
      name: `Mock Item ${i}`,
    });
  }
  return { results };
};

const results = generateMockResults(100000);

const runOptimizedReduce = () => {
  const start = performance.now();

  const mainTypes = results.results.some((r) => r.type === 'location')
    ? ['location', 'park', 'attraction', 'show', 'restaurant']
    : ['park', 'attraction', 'show', 'restaurant', 'location'];

  const groups = [];

  const itemsByType = results.results.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {});

  mainTypes.forEach((type) => {
    const items = itemsByType[type];
    if (!items || items.length === 0) return;
    groups.push({ key: type, count: items.length });
  });

  const end = performance.now();
  return end - start;
};

const runOptimizedGroupBy = () => {
  const start = performance.now();

  const mainTypes = results.results.some((r) => r.type === 'location')
    ? ['location', 'park', 'attraction', 'show', 'restaurant']
    : ['park', 'attraction', 'show', 'restaurant', 'location'];

  const groups = [];

  const itemsByType = Object.groupBy(results.results, (r) => r.type);

  mainTypes.forEach((type) => {
    const items = itemsByType[type];
    if (!items || items.length === 0) return;
    groups.push({ key: type, count: items.length });
  });

  const end = performance.now();
  return end - start;
};

for (let i = 0; i < 10; i++) {
  runOptimizedReduce();
  runOptimizedGroupBy();
}

let reduceTotal = 0;
let groupByTotal = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  reduceTotal += runOptimizedReduce();
  groupByTotal += runOptimizedGroupBy();
}

console.log(`Reduce Average: ${(reduceTotal / iterations).toFixed(3)} ms`);
console.log(`GroupBy Average: ${(groupByTotal / iterations).toFixed(3)} ms`);
