# Ihsan Fajari — Off-Road CV 🚙

Interactive 3D résumé: drive a low-poly off-road pickup around a procedurally
generated island and discover 5 glowing beacons, each unlocking a section of
the CV (About, Experience, Projects, Skills, Education & Contact).

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
node scripts/smoke.mjs   # drives the truck in headless Chrome, saves screenshots
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

## Where things live

- `src/config.js` — world size, spawn point, beacon positions, dirt-path routes
- `src/heightmap.js` — analytic terrain: heights, biome weights (grass/forest/desert/snow/beach)
- `src/terrain.js` — terrain mesh w/ per-face colors, sea, clouds
- `src/props.js` — instanced trees/cacti/palms/rocks + collision grid
- `src/car.js` — procedural pickup model + arcade physics
- `src/zones.js` — beacon visuals & labels
- `src/cv-data.js` — **résumé content (edit this to update the CV)**
- `src/ui.js` — HUD, panels, toasts, off-screen zone arrows
- `public/Resume-Ihsan-Fajari.pdf` — downloadable PDF résumé
