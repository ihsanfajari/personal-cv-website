// Dev report: track length, elevation range, and the sharpest crests
// (a crest needs dSlope/ds below roughly -107/v^2 to launch the truck).
import { buildTrack } from '../src/race/track.js';

const t0 = Date.now();
const tr = buildTrack();
console.log('build ms:', Date.now() - t0);
console.log('length m:', tr.length.toFixed(1), '| samples:', tr.count);

let minY = Infinity, maxY = -Infinity;
for (let i = 0; i < tr.count; i++) { minY = Math.min(minY, tr.y[i]); maxY = Math.max(maxY, tr.y[i]); }
console.log('elevation:', minY.toFixed(1), '..', maxY.toFixed(1));

const evs = [];
for (let i = 2; i < tr.count - 2; i++) {
  const sPrev = (tr.y[i] - tr.y[i - 2]) / 2;
  const sNext = (tr.y[i + 2] - tr.y[i]) / 2;
  evs.push({ i, ds: sNext - sPrev, x: tr.x[i], z: tr.z[i], y: tr.y[i] });
}
evs.sort((a, b) => a.ds - b.ds);
console.log('sharpest crests (dSlope per m, need < -0.40 at 60 km/h):');
for (const e of evs.slice(0, 8)) {
  console.log('  s=' + e.i + 'm  dSlope=' + e.ds.toFixed(3) + '  at ' + e.x.toFixed(0) + ',' + e.z.toFixed(0) + '  y=' + e.y.toFixed(1));
}

const t1 = Date.now();
let acc = 0;
for (let i = 0; i < 200000; i++) acc += tr.query((i % 700) - 350, ((i * 7) % 700) - 350).d;
console.log('200k queries ms:', Date.now() - t1, '(checksum', acc.toFixed(0) + ')');
