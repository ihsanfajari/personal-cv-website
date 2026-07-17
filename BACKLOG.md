# Backlog

Recorded 2026-07-04.

1. Deploy the website (target: Vercel, static Vite build). — build verified 2026-07-17; needs Vercel account login (see README/notes).
2. ~~Redesign the map/road layout.~~ ✅ Done 2026-07-17 (revised same day) — all dirt trails removed except the short spawn→About curve at the island center; the other 4 beacons blend into their biomes with no explicit route, so finding them is pure exploration (quest compass + edge markers still give rough direction). Verified the snowy mountain is climbable without path smoothing (headless drive test reached the Skills beacon in ~5 s). Joke signs remain as scattered wilderness landmarks.
3. ~~Achievement "Odometer": set target distance to 5 km.~~ ✅ Done 2026-07-17.
4. ~~Achievement "Timberr!": rename to "The Timber Car".~~ ✅ Done 2026-07-17.
5. ~~Lock phone number and email behind completing ALL achievements.~~ ✅ Done 2026-07-17 — email/WA/PDF-résumé links render into `[data-contact-slot]` only when all 5 achievements are earned (LinkedIn/GitHub stay public); locked state shows an "exclusive access" teaser with progress. Note: the PDF file itself is still at a guessable public URL (`/Resume-Ihsan-Fajari.pdf`) — soft lock only.
6. ~~Add another car with lore/dialog.~~ ✅ Done 2026-07-17 — "Rusty", a retired delivery van (`src/npc.js`) parked off the coastal trail at (70, 95), cycles 6 dialog lines in a speech bubble when the player is near; solid collider registered in props.js.
7. ~~Add more random props.~~ ✅ Done 2026-07-17 — flowers, grass tufts, dead trees (desert, knockable), driftwood (beach), snowmen (snow, knockable); scatter attempts 15k → 24k.
8. **Major**: real-time multiplayer via WebSocket — visitors can see other visitors currently browsing/driving around the site live. Also add a main-menu name input where visitors can type their own name; if left blank, assign a random name like "guest[3-digit number]" (needs a persistence/counter mechanism, likely server-side).
9. ~~**[Quick Win]** Quest log / compass hint UI: show progress ("3/5 beacons found") with a rough direction toward undiscovered zones, without spoiling exact locations. Pairs with the existing "???" locked achievement slots.~~ ✅ Done 2026-07-04 — quest chip under the HUD name with a 45°-quantized compass arrow + rough range hint (`ui.updateQuest`).
10. ~~**[Quick Win]** Photo/Postcard mode: screenshot button that generates an image with a small watermark (name + link) for sharing on LinkedIn/Twitter — free viral loop for personal branding.~~ ✅ Done 2026-07-04 — 📸 HUD button, watermark plate (name + LinkedIn), downloads PNG (`src/photo.js`).
11. ~~**[Quick Win]** Tangible achievement rewards: unlock car paint/skins per achievement, in addition to locking contact info (see #5) behind full completion. Immediate in-game payoff, not just an end-game unlock.~~ ✅ Done 2026-07-04 — 🎨 Garage in the achievements menu, 5 paints (one per achievement) + default red, saved in localStorage (`SKINS`, `Car.setPaint`).
12. ~~**[Quick Win]** Signpost/billboard jokes at road intersections (ties into #2's road redesign) — short humorous text to make the world feel more alive; cheap to build, similar to the existing zone label sprites.~~ ✅ Done 2026-07-04 — 6 wooden joke signs along the paths (`src/signs.js`); reposition when #2's road redesign lands.
13. Time trial / checkpoint mini-game: short timed route between two zones, personal best saved in localStorage. Adds replay value beyond one-time exploration.
14. Ambient audio per biome: desert wind, beach waves, forest birds, mountain wind — layered on top of the existing audio.js.
15. Simple weather/particle effects per biome: snow falling at the peaks, blowing sand in the desert, matching the zone colors already defined in cv-data.js.
16. Second NPC car with dialog (see #6) placed along a rarely-traveled route between zones, so it doubles as an implicit nudge toward under-explored areas.
17. Async leaderboard (cheaper alternative to #8's real-time multiplayer): submit score/distance/time to a serverless endpoint (Vercel function + KV/Supabase), display top 10 names. Gives a "shared world" feel without WebSocket complexity.
