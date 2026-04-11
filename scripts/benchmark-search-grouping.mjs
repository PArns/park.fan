import { performance } from 'node:perf_hooks';

// Mock data
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

const results = generateMockResults(100000); // large number to make diff obvious

// Baseline
const runBaseline = () => {
  const start = performance.now();

  const mainTypes = results.results.some((r) => r.type === 'location')
    ? ['location', 'park', 'attraction', 'show', 'restaurant']
    : ['park', 'attraction', 'show', 'restaurant', 'location'];

  const groups = [];

  mainTypes.forEach((type) => {
    const items = results.results.filter((r) => r.type === type);
    if (items.length === 0) return;
    groups.push({ key: type, count: items.length });
  });

  const end = performance.now();
  return end - start;
};

// Optimized
const runOptimized = () => {
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

// Warmup
for (let i = 0; i < 10; i++) {
  runBaseline();
  runOptimized();
}

let baselineTotal = 0;
let optimizedTotal = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  baselineTotal += runBaseline();
  optimizedTotal += runOptimized();
}

console.log(`Baseline Average: ${(baselineTotal / iterations).toFixed(3)} ms`);
console.log(`Optimized Average: ${(optimizedTotal / iterations).toFixed(3)} ms`);
console.log(
  `Improvement: ${(((baselineTotal - optimizedTotal) / baselineTotal) * 100).toFixed(2)}%`
);
