// Terrain sampling front-end. Every module (car physics, terrain mesh, props,
// signs) samples the world through here, so swapping the active world profile
// swaps the whole map underneath them.
//
// Profiles live in src/worlds/ (the CV island) and src/race/ (the race track).
// A profile is `{ id, bounds, info(x, z), mud?(x, z) }`.

import { islandWorld } from './worlds/island.js';
import { WORLD } from './config.js';

let active = islandWorld;

// Swap the active world. `WORLD` in config.js is intentionally a mutable object
// so the modules that already imported it (car bounds, terrain mesh size) pick
// up the new profile's dimensions without any extra plumbing.
export function setWorld(world) {
  active = world;
  Object.assign(WORLD, world.bounds);
}

export function activeWorld() {
  return active;
}

// Full terrain info; `height` alone is cheaper via terrainHeight().
export function terrainInfo(x, z) {
  return active.info(x, z);
}

export function terrainHeight(x, z) {
  return active.info(x, z).height;
}

export function biomes(x, z) {
  return active.info(x, z).biomes;
}

export function pathMask(x, z) {
  return active.info(x, z).path;
}

// Sludge factor 0..1 (mud pits, water crossings). Worlds without mud return 0.
export function terrainMud(x, z) {
  return active.mud ? active.mud(x, z) : 0;
}

// Terrain normal via central differences (analytic-friendly, used by car + props).
export function terrainNormal(x, z, out) {
  const e = 1.2;
  const hl = terrainHeight(x - e, z);
  const hr = terrainHeight(x + e, z);
  const hd = terrainHeight(x, z - e);
  const hu = terrainHeight(x, z + e);
  out.set(hl - hr, 2 * e, hd - hu).normalize();
  return out;
}
