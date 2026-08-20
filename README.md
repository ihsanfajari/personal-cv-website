# Ihsan Fajari — Off-Road CV 🚙

Interactive 3D résumé: drive a low-poly off-road pickup around a procedurally
generated island and discover 5 glowing beacons, each unlocking a section of
the CV (About, Experience, Projects, Skills, Education & Contact).

There is also a second map: **Autumn Ridge**, a 1.7 km start-to-finish time
trial at `/off-road-racing`, reached from the checkered archway east of the
trailhead on the island.

Built with **Three.js + Vite** — no 3D asset files, the whole world (terrain,
biomes, trees, the truck) is generated in code, so the entire site is ~136 kB
gzipped plus the PDF résumé.

## Controls

| Input | Action |
|---|---|
| `W A S D` / arrows | Drive & steer |
| `Space` | Brake, then reverse |
| `R` (or ↺ button) | Reset the truck |
| `M` (or 🔊 button) | Mute / unmute audio |
| `Esc` / ✕ | Close a CV panel |
| Touch (mobile) | Virtual joystick on the left half of the screen |

On the race page `R` (or ↺) puts the truck back on the last checkpoint — the
clock keeps running.

## Autumn Ridge time trial (`/off-road-racing`)

A single timed run: 1.7 km, three jumps, a creek crossing and a mud basin,
five ordered checkpoints, top speed capped at 60 km/h. A clean run is around
1:50–2:20. The course is a closed corridor — banks, cliffs and rally fencing
box the truck in the whole way, so there is nowhere to cut and nowhere to fall
off the map.

Best time is kept in `localStorage` only; there is no leaderboard and no
backend. The finish screen renders a shareable PNG card (name, link and the
finish time) via the same watermark code as the island's photo mode.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the production build locally
```

### Headless smoke test

With the dev server running:

```bash
node scripts/smoke.mjs            # drives the island, saves screenshots
node scripts/race-smoke.mjs       # autopilots a full time-trial run and reports
                                  # lap time, splits, jumps and the finish card
node scripts/race-wall-probe.mjs  # drives head-on into the course boundary at
                                  # four sites and reports how far it gets
node scripts/track-report.mjs     # no browser: track length, elevation, crests
```

(Requires Google Chrome installed; screenshots go to `SHOT_DIR` env var or CWD.)

## Deploy (Vercel)

The site is fully static — any static host works.

```bash
npm i -g vercel
vercel           # from this folder; accept defaults (Vite is auto-detected)
vercel --prod
```

Or push the folder to GitHub and import the repo at https://vercel.com/new —
framework preset **Vite**, build command `npm run build`, output `dist`.

`vercel.json` only exists to rewrite `/off-road-racing` (no trailing slash) onto
the race page; everything else is plain static file serving.

## Where things live

- `src/config.js` — world size, spawn point, beacon positions, dirt-path routes
- `src/heightmap.js` — terrain front-end; `setWorld()` swaps the active world profile
- `src/worlds/island.js` — the CV island profile: heights + biome weights
- `src/race/track.js` — **the race course: edit `CONTROL_POINTS` to reshape it**
- `src/race/world.js` — race terrain profile derived from the track (corridor, cliffs, mud)
- `src/race/main.js` — race loop: countdown, clock, checkpoints, respawn, boundary clamp
- `src/racegate.js` — the archway on the island that links across to the race
- `src/terrain.js` — terrain mesh w/ per-face colors, sea, clouds
- `src/props.js` — instanced trees/cacti/palms/rocks + collision grid
- `src/car.js` — procedural pickup model + arcade physics
- `src/zones.js` — beacon visuals & labels
- `src/cv-data.js` — **résumé content (edit this to update the CV)**
- `src/ui.js` — HUD, panels, toasts, off-screen zone arrows
- `public/Resume-Ihsan-Fajari.pdf` — downloadable PDF résumé
