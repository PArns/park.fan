import { performance } from 'perf_hooks';

const mainTypes = ['location', 'park', 'attraction', 'show', 'restaurant'];
const results = {
  results: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    type: mainTypes[Math.floor(Math.random() * mainTypes.length)],
    name: `Item ${i}`,
  })),
};

function testGroupBy() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    const itemsByType = Object.groupBy(results.results, (r) => r.type);
    mainTypes.forEach((type) => {
      void itemsByType[type];
    });
  }
  return performance.now() - start;
}

function testReduce() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    const itemsByType = results.results.reduce((acc, r) => {
      if (!acc[r.type]) acc[r.type] = [];
      acc[r.type].push(r);
      return acc;
    }, {});
    mainTypes.forEach((type) => {
      void itemsByType[type];
    });
  }
  return performance.now() - start;
}

function testForLoop() {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    const itemsByType = { location: [], park: [], attraction: [], show: [], restaurant: [] };
    for (let j = 0; j < results.results.length; j++) {
      const r = results.results[j];
      itemsByType[r.type].push(r);
    }
    mainTypes.forEach((type) => {
      void itemsByType[type];
    });
  }
  return performance.now() - start;
}

console.log(`GroupBy: ${testGroupBy().toFixed(2)} ms`);
console.log(`Reduce: ${testReduce().toFixed(2)} ms`);
console.log(`For Loop: ${testForLoop().toFixed(2)} ms`);
