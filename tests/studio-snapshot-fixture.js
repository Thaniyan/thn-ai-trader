// Before/after measurement only: identical synthetic data and observation clock.
// Full release regressions continue to use their original real-clock fixtures.
const anchor=Number(process.env.TEST_SNAPSHOT_TIME);
if(!Number.isFinite(anchor)||anchor<=0)throw Error('Explicit synthetic snapshot clock required');
Date.now=()=>anchor;
await import('./browser-provider.js');
