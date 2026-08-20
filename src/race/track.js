// "Autumn Ridge" — the race course centreline.
//
// The whole race world is derived from this one polyline: terrain height, the
// corridor the player drives in, the cliffs that box them in, where the mud and
// the water crossings sit, and where the checkpoint gates stand.
//
// Control points carry:
//   x, z    world position of the centreline
//   y       centreline elevation (piecewise-linear between points, then smoothed)
//   w       half-width of the drivable corridor
//   sm      smoothing radius for `y` in metres (small = sharp fold = jump ramp)
//   wall    0..1 height of the boundary: 1 = tall cliff, ~0.4 = low embankment
//   mud     0..1 sludge on the corridor
//   water   0..1 water crossing on the corridor
//   fence   0..1 wooden rally fencing along the corridor edge

const DEFAULT_SM = 5;
const DEFAULT_WALL = 1;

export const CONTROL_POINTS = [
  // --- A. Start straight: wide, fenced, flat out ---
  { x: -262, z: 248, y: 8, w: 14, wall: 0.4, fence: 1 },
  { x: -190, z: 248, y: 8, w: 14, wall: 0.4, fence: 1 },
  { x: -120, z: 244, y: 9, w: 13, wall: 0.5, fence: 1 },

  // --- B. Right-hand sweep, climbing onto the ridge ---
  { x: -60, z: 226, y: 12, w: 12, wall: 0.7 },
  { x: -14, z: 198, y: 16, w: 12, wall: 0.9 },

  // --- C. Ridge run + JUMP 1 (warm-up kicker) ---
  { x: 26, z: 186, y: 20, w: 12, wall: 0.9 },
  { x: 40, z: 183, y: 23.5, w: 12, wall: 0.9, sm: 0.4 },   // crest
  { x: 52, z: 181, y: 16, w: 13, wall: 0.8, sm: 2 },       // landing
  { x: 78, z: 176, y: 13, w: 13, wall: 0.7 },

  // --- D. Descent into the creek crossing ---
  { x: 118, z: 166, y: 8, w: 13, wall: 0.6 },
  { x: 146, z: 158, y: 5.4, w: 13, wall: 0.5, water: 1 },  // creek
  { x: 158, z: 154, y: 5.4, w: 13, wall: 0.5, water: 1 },
  { x: 178, z: 146, y: 7, w: 13, wall: 0.6 },

  // --- E. Long climb up the east side ---
  { x: 226, z: 112, y: 12, w: 12, wall: 0.8 },
  { x: 252, z: 60, y: 18, w: 12, wall: 1 },
  { x: 252, z: 10, y: 21, w: 12, wall: 1 },

  // --- F. Forest esses: sweeping, has to be braked for, still flowing ---
  { x: 226, z: -38, y: 22, w: 12, wall: 1 },
  { x: 250, z: -88, y: 23.5, w: 12, wall: 1 },
  { x: 222, z: -136, y: 25, w: 12, wall: 1 },

  // --- G. Straightening up for the BIG DROP (jump 2) ---
  { x: 232, z: -176, y: 31, w: 12, wall: 1 },
  { x: 236, z: -196, y: 37, w: 11, wall: 0.9, sm: 0.4 },   // crest
  { x: 240, z: -216, y: 24, w: 13, wall: 0.8, sm: 2 },     // landing
  { x: 242, z: -244, y: 15, w: 14, wall: 0.7 },            // run-out

  // --- H. Wide right-hander onto the fast run west ---
  { x: 224, z: -262, y: 13, w: 15, wall: 0.6 },
  { x: 186, z: -270, y: 11, w: 14, wall: 0.5 },
  { x: 140, z: -274, y: 10, w: 13, wall: 0.4, fence: 1 },
  { x: 50, z: -270, y: 9, w: 13, wall: 0.4, fence: 1 },
  { x: -36, z: -254, y: 7, w: 14, wall: 0.5 },

  // --- I. Mud basin: wide and slow, a drier line on the inside ---
  { x: -100, z: -234, y: 4.5, w: 15, wall: 0.5, mud: 1 },
  { x: -140, z: -216, y: 4.2, w: 15, wall: 0.5, mud: 1 },
  { x: -172, z: -192, y: 6, w: 14, wall: 0.6, mud: 0.5 },

  // --- J. Rocky climb, straightening into JUMP 3 at the summit ---
  { x: -216, z: -156, y: 14, w: 12, wall: 0.9 },
  { x: -248, z: -110, y: 24, w: 12, wall: 1 },
  { x: -260, z: -78, y: 30, w: 12, wall: 1 },
  { x: -262, z: -58, y: 34, w: 11, wall: 0.9, sm: 0.4 },   // crest
  { x: -262, z: -42, y: 23, w: 12, wall: 0.8, sm: 2 },     // landing
  { x: -258, z: -14, y: 21, w: 12, wall: 0.8 },

  // --- K. Finish descent ---
  { x: -238, z: 30, y: 14, w: 13, wall: 0.7, fence: 1 },
  { x: -208, z: 76, y: 10, w: 13, wall: 0.5, fence: 1 },
  { x: -176, z: 112, y: 8, w: 14, wall: 0.4, fence: 1 },
];

const SAMPLE_STEP = 1;    // metres between centreline samples
const CELL = 25;          // nearest-sample lookup grid, metres
const SLACK = 40;         // candidate band, must exceed CELL * sqrt(2)

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

export function buildTrack(points = CONTROL_POINTS) {
  const n = points.length;
  const at = (i) => points[Math.min(n - 1, Math.max(0, i))];

  // --- 1. dense polyline through the control points (Catmull-Rom on x/z) ---
  const raw = [];
  const SUB = 24;
  for (let i = 0; i < n - 1; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    for (let k = 0; k < SUB; k++) {
      const t = k / SUB;
      raw.push({
        x: catmull(p0.x, p1.x, p2.x, p3.x, t),
        z: catmull(p0.z, p1.z, p2.z, p3.z, t),
        seg: i, t,
      });
    }
  }
  raw.push({ x: at(n - 1).x, z: at(n - 1).z, seg: n - 2, t: 1 });

  // arc length along the dense polyline, plus each control point's station
  const cum = [0];
  for (let i = 1; i < raw.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].z - raw[i - 1].z));
  }
  const length = cum[cum.length - 1];
  const station = new Array(n);
  for (let i = 0; i < raw.length; i++) {
    if (raw[i].t === 0) station[raw[i].seg] = cum[i];
  }
  station[n - 1] = length;

  // --- 2. resample at a fixed step, interpolating the control attributes ---
  const count = Math.floor(length / SAMPLE_STEP) + 1;
  const sx = new Float32Array(count), sz = new Float32Array(count);
  const sy = new Float32Array(count), sw = new Float32Array(count);
  const sMud = new Float32Array(count), sWater = new Float32Array(count);
  const sWall = new Float32Array(count), sFence = new Float32Array(count);
  const sSm = new Float32Array(count);
  const stx = new Float32Array(count), stz = new Float32Array(count);

  let ri = 0;
  for (let i = 0; i < count; i++) {
    const s = i * SAMPLE_STEP;
    while (ri < cum.length - 2 && cum[ri + 1] < s) ri++;
    const span = cum[ri + 1] - cum[ri] || 1;
    const f = Math.min(1, Math.max(0, (s - cum[ri]) / span));
    sx[i] = raw[ri].x + (raw[ri + 1].x - raw[ri].x) * f;
    sz[i] = raw[ri].z + (raw[ri + 1].z - raw[ri].z) * f;

    // attributes ride on the control-point stations, linearly
    let ci = 0;
    while (ci < n - 2 && station[ci + 1] < s) ci++;
    const cspan = station[ci + 1] - station[ci] || 1;
    const cf = Math.min(1, Math.max(0, (s - station[ci]) / cspan));
    const a = points[ci], b = points[ci + 1];
    const mix = (key, dflt) => {
      const av = a[key] ?? dflt, bv = b[key] ?? dflt;
      return av + (bv - av) * cf;
    };
    sy[i] = mix('y', 0);
    sw[i] = mix('w', 12);
    sMud[i] = mix('mud', 0);
    sWater[i] = mix('water', 0);
    sWall[i] = mix('wall', DEFAULT_WALL);
    sFence[i] = mix('fence', 0);
    // smoothing radius takes the sharper of the two ends so a crest stays crisp
    sSm[i] = Math.min(a.sm ?? DEFAULT_SM, b.sm ?? DEFAULT_SM);
  }

  // --- 3. variable-radius smoothing of the elevation profile ---
  // Wide radius = rolling hills; a radius under a metre keeps the jump crests
  // as hard folds, which is what actually launches the truck.
  const smoothed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.round(sSm[i] / SAMPLE_STEP);
    if (r < 1) { smoothed[i] = sy[i]; continue; }
    let sum = 0, wsum = 0;
    for (let k = -r; k <= r; k++) {
      const j = Math.min(count - 1, Math.max(0, i + k));
      const wgt = 1 - Math.abs(k) / (r + 1);
      sum += sy[j] * wgt; wsum += wgt;
    }
    smoothed[i] = sum / wsum;
  }
  sy.set(smoothed);

  // --- 4. tangents ---
  for (let i = 0; i < count; i++) {
    const a = Math.max(0, i - 1), b = Math.min(count - 1, i + 1);
    const dx = sx[b] - sx[a], dz = sz[b] - sz[a];
    const len = Math.hypot(dx, dz) || 1;
    stx[i] = dx / len; stz[i] = dz / len;
  }

  // --- 5. nearest-sample lookup grid ---
  // Each cell stores every sample within (nearest + SLACK) of the cell centre.
  // SLACK > CELL*sqrt(2) guarantees the true nearest sample for any point in
  // the cell is in the list, even where the course doubles back on itself.
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    if (sx[i] < minX) minX = sx[i];
    if (sx[i] > maxX) maxX = sx[i];
    if (sz[i] < minZ) minZ = sz[i];
    if (sz[i] > maxZ) maxZ = sz[i];
  }
  const pad = 200;
  const gx0 = Math.floor((minX - pad) / CELL), gx1 = Math.ceil((maxX + pad) / CELL);
  const gz0 = Math.floor((minZ - pad) / CELL), gz1 = Math.ceil((maxZ + pad) / CELL);
  const gw = gx1 - gx0 + 1, gh = gz1 - gz0 + 1;
  const cells = new Array(gw * gh);

  for (let cz = 0; cz < gh; cz++) {
    for (let cx = 0; cx < gw; cx++) {
      const px = (gx0 + cx) * CELL + CELL / 2;
      const pz = (gz0 + cz) * CELL + CELL / 2;
      let best = Infinity;
      for (let i = 0; i < count; i++) {
        const dx = px - sx[i], dz = pz - sz[i];
        const d2 = dx * dx + dz * dz;
        if (d2 < best) best = d2;
      }
      const limit = Math.sqrt(best) + SLACK;
      const lim2 = limit * limit;
      const list = [];
      for (let i = 0; i < count; i++) {
        const dx = px - sx[i], dz = pz - sz[i];
        if (dx * dx + dz * dz <= lim2) list.push(i);
      }
      cells[cz * gw + cx] = Int32Array.from(list);
    }
  }

  const scratch = {
    d: 0, s: 0, i: 0, y: 0, w: 12, mud: 0, water: 0, wall: 1, fence: 0, tx: 0, tz: 1, side: 0,
  };

  function query(x, z, o = scratch) {
    const cx = Math.min(gw - 1, Math.max(0, Math.floor(x / CELL) - gx0));
    const cz = Math.min(gh - 1, Math.max(0, Math.floor(z / CELL) - gz0));
    const list = cells[cz * gw + cx];

    let bi = 0, bd = Infinity;
    for (let k = 0; k < list.length; k++) {
      const i = list[k];
      const dx = x - sx[i], dz = z - sz[i];
      const d2 = dx * dx + dz * dz;
      if (d2 < bd) { bd = d2; bi = i; }
    }

    // refine: project onto the two segments meeting at the nearest sample
    let bestD = Math.sqrt(bd), bestS = bi * SAMPLE_STEP, bestI = bi;
    for (const j of [bi - 1, bi]) {
      if (j < 0 || j >= count - 1) continue;
      const ax = sx[j], az = sz[j];
      const dx = sx[j + 1] - ax, dz = sz[j + 1] - az;
      const len2 = dx * dx + dz * dz || 1;
      let t = ((x - ax) * dx + (z - az) * dz) / len2;
      t = Math.min(1, Math.max(0, t));
      const px = ax + dx * t, pz = az + dz * t;
      const d = Math.hypot(x - px, z - pz);
      if (d < bestD) {
        bestD = d;
        bestS = (j + t) * SAMPLE_STEP;
        bestI = t < 0.5 ? j : j + 1;
      }
    }

    // interpolate attributes at the exact arc position
    const fi = Math.min(count - 1, Math.max(0, bestS / SAMPLE_STEP));
    const i0 = Math.floor(fi), i1 = Math.min(count - 1, i0 + 1), f = fi - i0;
    const L = (arr) => arr[i0] + (arr[i1] - arr[i0]) * f;

    o.d = bestD;
    o.s = bestS;
    o.i = bestI;
    o.y = L(sy);
    o.w = L(sw);
    o.mud = L(sMud);
    o.water = L(sWater);
    o.wall = L(sWall);
    o.fence = L(sFence);
    o.tx = stx[bestI];
    o.tz = stz[bestI];
    // which side of the centreline: +1 left, -1 right
    o.side = Math.sign((x - sx[bestI]) * stz[bestI] - (z - sz[bestI]) * stx[bestI]) || 1;
    return o;
  }

  function sampleAt(s) {
    const fi = Math.min(count - 1, Math.max(0, s / SAMPLE_STEP));
    const i0 = Math.floor(fi), i1 = Math.min(count - 1, i0 + 1), f = fi - i0;
    const L = (arr) => arr[i0] + (arr[i1] - arr[i0]) * f;
    return {
      s, x: L(sx), z: L(sz), y: L(sy), w: L(sw),
      tx: stx[i0], tz: stz[i0],
      heading: Math.atan2(stx[i0], stz[i0]),
      mud: L(sMud), water: L(sWater), wall: L(sWall), fence: L(sFence),
    };
  }

  return {
    length, count, step: SAMPLE_STEP,
    x: sx, z: sz, y: sy, w: sw, mud: sMud, water: sWater, wall: sWall, fence: sFence,
    tx: stx, tz: stz,
    query, sampleAt,
  };
}
