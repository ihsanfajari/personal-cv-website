// World layout constants shared across modules.

export const WORLD = {
  size: 520,            // terrain plane width/depth
  segments: 200,        // terrain resolution
  islandRadius: 210,    // full land up to here, then falls into the sea
  islandFade: 250,      // fully underwater beyond this
  waterLevel: 0,
};

export const SPAWN = { x: 0, z: 34, heading: Math.PI }; // facing -z (north, toward About beacon)

// Zone world positions — must agree with the biome masks in heightmap.js
export const ZONE_POS = {
  about:      { x: 0,    z: -8   }, // grass plains, near spawn
  experience: { x: -150, z: 5    }, // forest (west)
  projects:   { x: 155,  z: 25   }, // desert (east)
  skills:     { x: 30,   z: -150 }, // snowy mountain (north)
  education:  { x: -30,  z: 158  }, // beach (south)
};

// Where the NPC van "Rusty" is parked: just off the coastal trail, in the
// quiet southeast corner between the desert and beach routes.
export const NPC_POS = { x: 70, z: 95, heading: -Math.PI / 3 };

// The only marked dirt trail: a short curve from the trailhead to the About
// beacon at the island's center. Every other beacon blends into its biome with
// no explicit route — finding them is the exploration.
const PATH_ROUTES = [
  [{ x: 0, z: 34 }, { x: 6, z: 12 }, { x: 0, z: -8 }],
];

export const PATH_SEGMENTS = PATH_ROUTES.flatMap((route) => {
  const segs = [];
  for (let i = 0; i < route.length - 1; i++) segs.push([route[i], route[i + 1]]);
  return segs;
});

export const PATH_WIDTH = 7; // full smoothing/tint inside this distance
