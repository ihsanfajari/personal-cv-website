// The "Autumn Ridge" world profile.
//
// Everything is derived from the track centreline: inside the corridor the
// ground is the designed course elevation, outside it climbs away into berms
// and cliffs so the truck is physically boxed in for the whole run.

import { fbm, smoothstep, lerp } from '../noise.js';
import { buildTrack } from './track.js';

export const RACE_BOUNDS = {
  size: 700,          // terrain plane width/depth
  segments: 280,      // 2.5 m quads
  islandRadius: 9999, // no island falloff in this world
  islandFade: 480,    // car.js radial clamp sits outside the map
  waterLevel: -400,   // disables the island's sink-in-the-sea behaviour
};

export const EDGE = 3.0;    // shoulder past the corridor before the wall starts
export const WALL_MAX = 14; // tallest cliff, scaled per section by `wall`

// The boundary has two jobs: stop the truck and stay out of the view. It rises
// steeply enough that the engine cannot climb more than a few metres of it
// (slope gravity outruns the accelerator past about 2.2), then flattens into
// the wooded plateau so the autumn forest reads close to the course.

export const track = buildTrack();

// How high the boundary has risen `over` metres past the shoulder.
function wallRise(over, wallH) {
  const raw = 0.9 * over + Math.pow(0.62 * over, 1.6);
  return Math.min(wallH, raw);
}

// Slope of that wall, used for rock vs scrub colouring (0 once it has capped).
export function wallSteepness(over, wallH) {
  const raw = 0.9 * over + Math.pow(0.62 * over, 1.6);
  if (raw >= wallH || over <= 0) return 0;
  return 0.9 + 1.6 * 0.62 * Math.pow(0.62 * over, 0.6);
}

// Sludge across the corridor. The basin is not uniform: a drier ribbon runs
// down one side, so the fast line through the mud is there to be found.
function sludge(qq, x, z) {
  if (qq.mud <= 0.001 && qq.water <= 0.001) return 0;
  const lat = qq.w > 0 ? (qq.d / qq.w) * qq.side : 0;   // -1..1 across the corridor
  const dry = Math.exp(-Math.pow((lat + 0.55) / 0.3, 2));
  const patch = 0.72 + 0.56 * fbm(x * 0.05 + 3, z * 0.05 + 8, 2);
  const wet = qq.mud * (1 - 0.8 * dry) * patch + qq.water * 1.15;
  return Math.min(1, Math.max(0, wet));
}

const q = {};

export function info(x, z) {
  track.query(x, z, q);
  const d = q.d, w = q.w;

  const inside = smoothstep(w + EDGE, w - 1.0, d);
  const over = Math.max(0, d - (w + EDGE));

  // --- driving surface: designed elevation + light ruts, sunk in the wet bits ---
  const wet = sludge(q, x, z);
  const ruts = (fbm(x * 0.22, z * 0.22, 2) - 0.5) * 0.24;
  const trackH = q.y + ruts - q.water * 1.15 - wet * 0.45;

  // --- boundary: berm, then cliff, following the course elevation ---
  const wall = wallRise(over, WALL_MAX * q.wall);
  const rough = (fbm(x * 0.018 + 11, z * 0.018 + 3, 4) - 0.5) * 11 *
    smoothstep(w + 7, w + 32, d);
  const hills = (fbm(x * 0.006 + 50, z * 0.006 + 20, 4) - 0.45) * 30 *
    smoothstep(w + 26, w + 120, d);

  // mountains ringing the map, keyed off the border rather than the centre so
  // they never swallow the sections that run close to the world edge
  const half = RACE_BOUNDS.size / 2;
  const edgeD = Math.min(half - Math.abs(x), half - Math.abs(z));
  const edgeRise = smoothstep(70, 4, edgeD) * 48;

  const outH = q.y + wall + rough + hills + edgeRise;
  const height = lerp(outH, trackH, inside);

  // Weights only feed the engine/surface audio mix; the terrain has its own palette.
  const forest = smoothstep(6, 26, over);
  const b = { grass: 1 - forest, forest, desert: 0, snow: 0, beach: 0 };

  return {
    height, biomes: b, path: inside, inland: 1,
    d, w, over, inside,
    y: q.y, mud: wet, water: q.water, wall: q.wall, fence: q.fence, s: q.s,
  };
}

// Sludge factor for the car: 0 on dry ground, 1 in the deepest mud.
export function mud(x, z) {
  track.query(x, z, q);
  const inside = smoothstep(q.w + EDGE, q.w - 1.0, q.d);
  return inside * sludge(q, x, z);
}

export const raceWorld = {
  id: 'autumn-ridge',
  bounds: RACE_BOUNDS,
  info,
  mud,
  track,
};
