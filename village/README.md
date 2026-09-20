# Wesley's alpine village

Local portfolio experiment on `codex/alpine-village`. Nothing has been pushed or published.

Run from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000/. Use the local server rather than opening the HTML file directly, because the case studies load on demand.

## The brief

The experience should leave someone thinking they would enjoy working with Wesley. A small, idealized Columbia Gorge: clear alpine light, a green mountain with snow at the top, a river at the bottom, and four related chalets. Thin, extruded pixel forms inspired by the animation at https://x.com/cssdesignawards/status/1389852971551268870 and https://y-n10.com/.

The chalets are BNY, Qualcomm, T-Mobile, and Overlay. Sketch-to-Revit and Iona do not have buildings or village links. The skier, cyclist, wing foiler, and blueberry picker represent Wesley's actual interests. Other villagers share the three attributed colleague quotes already in the portfolio. Apple trees, blossoms, chimney smoke, a sheep, and a fox make the place feel alive.

## Interactions

- Drag to pan, wheel or pinch to zoom. Fixed elevated camera, bounded movement. `+`, `-`, arrow keys, and `0` also control the view.
- Chalet signs and the buildings themselves open studies. The desktop panel is on the right; mobile uses a bottom sheet. The camera stays still.
- On mobile, drag the sheet's title bar upward to expand it and downward to return to its smaller height. Scroll inside the sheet to read.
- The village is centered slightly above the viewport midpoint, without a ground shadow. The name sign sits below the island, with the exploration hints centered beneath it.
- The welcome sign introduces Wesley. The trail directory opens the same studies. The mailbox links to email, the existing resume PDF, and LinkedIn.
- Click activity figures for personal speech bubbles and other villagers for attributed quotes. Pick an apple, greet the fox, or pet the sheep.
- The cyclist faces left after Qualcomm and right after T-Mobile. The skier descends, puts his skis on his back, and walks uphill for the next run. The foiler follows the full river between the shorelines.
- A raised timber bridge connects the banks. The fox has a clear patch of forest; the sheep grazes beside the blueberries, and Lan stands in the open meadow with his bench nearby.
- Music is an original, sparse synthesized loop. It starts only after pressing the music button. No audio file downloads.
- Animation can be paused, respects reduced-motion preferences, and stops while the tab is hidden. Music also suspends in the background.

## Implementation and loading

No framework, runtime dependencies, build step, remote font calls, downloaded scene textures, models, videos, or audio. Canvas draws a fixed isometric heightmap once, caches the pixel-object sprites, and reuses them for the animated view. This is a 2.5D canvas scene with fixed viewing angle, not a freely rotating 3D engine.

The opening request set is `index.html`, `village/village.css`, `village/village.js`, and the locally bundled `pixelify-sans.woff2`. Together these are about 62 KB raw and 28 KB with gzip. Those figures are a file-size budget, not a measured first-paint time. The Python preview server sends the uncompressed files. A future host should compress HTML, CSS, and JS and cache static assets.

Studies are separate HTML fragments requested on first opening and cached for the session. Their existing images use native lazy loading. All professional case-study content and colleague quotes come from the pre-experiment portfolio. The original resume PDF is unchanged. Pixelify Sans is redistributed under the SIL Open Font License in `fonts/OFL.txt`.

## Validation

- JavaScript syntax checked with `node --check village/village.js`.
- Run `node village/check.cjs` for the dependency-free Node VM interaction harness. It checks actor coordinates, terrain redraw stability, zoom limits and pointer anchors, camera invariance when panels open, all four studies, caching, directory, contact, welcome-sign clicks, and close/reset behavior.
- Skier checks cover downhill travel, uphill travel, alternating cached walking frames, still legs during pauses, continuity at phase boundaries, and the full 48-second repeat.
- Bridge checks inspect the actual deck, fascia, plank, and rail drawing bounds, including stroke widths, against its sprite canvas and final placement. Replacing its bounds with the standard upright sprite canvas makes this check fail.
- Layout checks cover horizontal centering, island/sign clearance, and viewport fit across desktop, portrait mobile, and short landscape sizes using mocked DOM dimensions.
- Verified every study image resolves to an existing file, is lazy-loaded, and retains its source alt text.
- Verified localhost HTTP response and measured raw/gzip initial payload.
- The supplied screenshot informed the composition changes. The latest rendering has not been inspected in a live browser because the supported browser tools are unavailable in this session. The VM checks do not verify CSS rendering, touch-device behavior, or real-device paint/load timing.

To return to the original portfolio after this experiment is saved, switch to `main`. No changes to remote branches are needed.
