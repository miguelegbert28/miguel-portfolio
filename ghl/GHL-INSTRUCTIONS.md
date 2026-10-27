# Put the portfolio on a GoHighLevel page

The whole site lives in one file: `ghl/ghl-embed.html` (about 37 KB). The code is pasted into GHL. The images, video frames and 3D model are loaded from this GitHub repo through jsDelivr, so the repo must be **public**.

## Before you paste
1. Push this repo to GitHub as `miguelegbert28/miguel-portfolio` (public, branch `main`).
2. Check that this URL loads an image in your browser:
   https://cdn.jsdelivr.net/gh/miguelegbert28/miguel-portfolio@main/docs/assets/img/poster_1280.webp
3. If your username, repo name or branch is different, open `ghl-embed.html`, find `const ASSET_BASE = ...` near the top of the `<script>` part, and change it. It must end with `/docs/assets/`.

## In the GHL site/funnel builder
1. Create a new page. Start from a **blank** template, or hide GHL's default header/footer/nav on this page. The portfolio has its own header and footer, and GHL's would sit on top of it.
2. Add a **Section** and set it to **full width**. Set the section padding and margin to **0**. Use one row and one column, also with 0 padding.
3. Drag in a **Custom Code** (also called Custom HTML / Code) element.
4. Open `ghl-embed.html`, select all, copy, and paste it into the element. Save.
5. Turn off page-level animations or "scroll effects" on that section if GHL has them enabled.
6. Click **Save**, then open the **live Preview** (or publish to a test URL).
   - The editor canvas often does **not run scripts**. There you will only see plain, stacked text, which is normal. Always judge it in live preview.
7. Test on your phone as well. Mobile shows a lighter version: a looping hero video, a dimmed 3D model and story cards.

## Editing
- Placeholder numbers: search the snippet for `[00]` and replace them. Remove the `<span class="ph">placeholder</span>` tag and the "Numbers marked…" line once the numbers are real.
- Booking link: search for `crm.ladder.marketing` (2 places in the HTML).
- Text: everything visible is plain HTML in the middle of the snippet.

## Notes
- Size: about 37 KB of code. All heavy files (about 10 MB) load from jsDelivr, not from GHL.
- jsDelivr caches `@main` for up to about 12 hours. After pushing changes to the assets, either wait, or create a release tag (for example `v1.0.0`) and use `@v1.0.0` in ASSET_BASE.
- three.js 0.186.1 and Lenis 1.3.27 load from cdn.jsdelivr.net (pinned versions).
- If something looks off, open the browser console (F12) on the live page and look for red errors. The usual cause is a wrong ASSET_BASE.
