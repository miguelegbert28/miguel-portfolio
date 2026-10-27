# Miguel Egbert Duenas — AI Automation Portfolio

A cinematic, single-page portfolio for Miguel Egbert Duenas, AI automation specialist (workflows, AI agents, chatbots, integrations).

- **Hero:** a scroll-scrubbed orbit video of Miguel (Seedance 2.5 via Higgsfield), shown as a 122-frame WebP sequence on a canvas with smooth inertia. The "AUTOMATE" headline sits behind a cutout of him. Four story passages are paired with transparent 3D renders (GPT Image 2.5).
- **About, Services (with Process) and Case Studies:** one persistent three.js scene holds a real 3D "automation core" model, built in Blender from `blender/automation_core.py` and exported as a Draco-compressed GLB. It moves, rotates and pulses its light paths as each section appears.
- **Final CTA and footer:** booking link, email and LinkedIn.
- **Fallbacks:**
  - Mobile: a looping hero video, lighter 3D and story cards.
  - `prefers-reduced-motion`: no scrubbing or smooth scrolling, and static images.

## Layout
```
src/            source (index.html, main.js, style.css, frames.js, public/assets/*)
docs/           built site, served by GitHub Pages (Settings → Pages → main /docs)
ghl/            GoHighLevel copy-paste embed (ghl-embed.html) + instructions
blender/        Blender script that builds the 3D model (Blender 4.2, run headless)
originals/      original hero frame, cutout and the raw Seedance clip
```

## Run locally
```bash
npm install
npm run dev        # dev server
npm run build      # rebuilds docs/
npx serve docs     # or: cd docs && python3 -m http.server 8765
```
Open the site through a local server, not by double-clicking `index.html`.

## Replace the placeholder case-study numbers
In `src/index.html`, search for `[00]`. There are three results lines, one per case study:
```html
<p class="result"><strong>[00] hrs → [00] min</strong> lead response time <span class="ph">placeholder</span></p>
```
Put in the real number and delete the `<span class="ph">placeholder</span>`. Once all three are real, also delete the line `<p class="note">Numbers marked … </p>`. Then run `npm run build` and commit `docs/`.
If you use the GoHighLevel embed, make the same edit in `ghl/ghl-embed.html`.

## Rebuild the 3D model
```bash
blender -b --factory-startup -P blender/automation_core.py
# writes automation_core.glb next to the paths set at the bottom of the script;
# copy it to src/public/assets/model/automation_core.glb
```

## GitHub Pages
Repo **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs`**.
All paths are relative, so it works at `https://miguelegbert28.github.io/miguel-portfolio/`.

## Credits
Generated assets: Higgsfield (Seedance 2.5, GPT Image 2.5). Built with three.js, Lenis and Vite.
© 2026 Miguel Egbert Duenas. All rights reserved.
