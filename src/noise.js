// Deterministic 2D value noise + fBm, shared by terrain mesh and car physics.

function hash2(ix, iz) {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iz, 0x165667b1) ^ 0x9e3779b9;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const u = fade(fx), v = fade(fz);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; // 0..1
}

export function fbm(x, z, octaves = 4) {
  let sum = 0, amp = 0.5, freq = 1, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, z * freq) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm; // 0..1
}

// ridged noise for dunes / crests, 0..1
export function ridge(x, z) {
  return 1 - Math.abs(2 * noise2(x, z) - 1);
}

export function smoothstep(a, b, v) {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}
