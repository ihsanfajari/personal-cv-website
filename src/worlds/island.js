// The CV island world profile: analytic heightfield + biome weights.
// Moved out of heightmap.js so a second world (the race track) can be swapped
// in without touching any of the modules that sample the terrain.

import { fbm, ridge, smoothstep, lerp } from '../noise.js';
import { ISLAND_BOUNDS, PATH_SEGMENTS, PATH_WIDTH } from '../config.js';

function distToSegment(px, pz, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  let t = ((px - a.x) * dx + (pz - a.z) * dz) / len2;
  t = Math.min(1, Math.max(0, t));
  const cx = a.x + dx * t, cz = a.z + dz * t;
  return Math.hypot(px - cx, pz - cz);
}

function pathMask(x, z) {
  let d = Infinity;
  for (const [a, b] of PATH_SEGMENTS) {
    const dd = distToSegment(x, z, a, b);
    if (dd < d) d = dd;
  }
  return smoothstep(PATH_WIDTH + 9, PATH_WIDTH, d);
}

// Biome weights sum to 1: { grass, forest, desert, snow, beach }
function biomes(x, z) {
  const wob = (fbm(x * 0.012 + 31.7, z * 0.012 + 7.3, 3) - 0.5) * 55;
  const snow = smoothstep(-72, -145, z + wob * 0.6);
  const desert = smoothstep(72, 145, x + wob) * (1 - snow);
  const forest = smoothstep(-72, -145, x + wob) * (1 - snow) * (1 - desert);
  const beach = smoothstep(82, 148, z + wob * 0.5) * (1 - snow) * (1 - desert) * (1 - forest);
  const grass = Math.max(0, 1 - snow - desert - forest - beach);
  return { grass, forest, desert, snow, beach };
}

function info(x, z) {
  const b = biomes(x, z);
  const path = pathMask(x, z);

  const rolling = (fbm(x * 0.009, z * 0.009, 4) - 0.42) * 13;
  const detail = (fbm(x * 0.045, z * 0.045, 3) - 0.5) * 2.6;
  const dunes = ridge(x * 0.016 + z * 0.006, z * 0.02) * 6.5 +
    (fbm(x * 0.03, z * 0.03, 2) - 0.5) * 2;
  const mountain = 15 + (fbm(x * 0.013 + 100, z * 0.013, 4) - 0.35) * 42 +
    ridge(x * 0.03 + 50, z * 0.03) * 5;

  // per-biome target heights
  const hGrass = 2.2 + rolling + detail;
  const hForest = 3.0 + rolling * 1.25 + detail;
  const hDesert = 2.4 + dunes;
  const hSnow = 2.2 + rolling * 0.4 + Math.max(0, mountain) * b.snow; // ramps up with weight
  const hBeach = 1.4 + rolling * 0.25 + detail * 0.3;

  let land =
    b.grass * hGrass + b.forest * hForest + b.desert * hDesert +
    b.snow * hSnow + b.beach * hBeach;

  // smooth + slightly lower terrain along the dirt path (keeps mountain ramps drivable)
  if (path > 0.001) {
    const smoothLand =
      b.grass * (2.2 + rolling * 0.6) + b.forest * (3.0 + rolling * 0.7) +
      b.desert * (2.4 + dunes * 0.35) + b.snow * (2.2 + rolling * 0.25 + Math.max(0, mountain) * b.snow * 0.72) +
      b.beach * 1.4;
    land = lerp(land, smoothLand, path);
  }

  // island falloff into the sea
  const r = Math.hypot(x, z);
  const inland = smoothstep(ISLAND_BOUNDS.islandFade, ISLAND_BOUNDS.islandRadius, r);
  const height = lerp(-9, land, inland);

  return { height, biomes: b, path, inland };
}

export const islandWorld = {
  id: 'island',
  bounds: ISLAND_BOUNDS,
  info,
};
