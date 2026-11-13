# Cookie Composer

A static, client-only web app that lets Jennifer create an animated "kindness fortune cookie" GIF and share it by text or email. The recipient only receives a GIF: no app, no link.

## The physical object we are imitating
A 4-5 inch circle of decorative paper is folded in half. A rectangular paper slip with a kind message sits in the crease, sticking out slightly at both ends. The half circle is folded in half again to look like a fortune cookie. The recipient unfolds it and pulls out the slip.

## Motion (Phase 2)
Mimics pulling the fortune out of a real paper cookie, timed in seconds via `src/scene/timeline.ts` (`MOTION_SECONDS=3.9`, `HOLD_SECONDS=4` for the GIF's final-frame delay):
1. 0.0-0.5s closed quarter-disc, gentle idle wobble that decays to nothing by the handoff.
2. 0.5-1.3s fold2 opens (quarter → half circle).
3. 1.3-1.7s front flap tips forward ~22°, revealing a shadowed sliver of the back half.
4. 1.7-2.0s slip peels up at its left end (the grip) while its right end stays pinned to the crease.
5. 2.0-2.5s slip rises at a constant tilt until clear of the whole cookie, then latches onto the frontmost paint layer.
6. 2.5-2.8s slip levels off (tilt back to 0).
7. 2.8-3.9s slip descends, grows, and settles into its final centered pose in one eased motion.
Text is drawn on the slip the whole time it's visible (once the halves are coincident) and stays glued to it through every transform.

## Hard rules
- No backend, no accounts, no analytics, no external API calls. Everything runs in the browser.
- Must work in iPhone Safari first (Jennifer uses an iPhone), then Android Chrome and desktop browsers.
- All animation is drawn by ONE pure function: drawFrame(ctx, t, config), where t runs 0..1. The preview and the GIF export both call it, so they always match.
- Render on Canvas 2D. Do not use CSS 3D transforms for the cookie.
- GIF target: 480x480, 15 fps, under 1 MB, final frame held about 4 s using the frame delay (not duplicate frames).
- Ask before adding any dependency. Approved so far: react, react-dom, vite, typescript, gifenc, idb-keyval, vite-plugin-pwa.
- Keep files small and focused. Prefer plain CSS modules over UI frameworks.
- Paper is patterned on both sides; the slip is white with a shadow and thin border.

## Stack
Vite + React (current version) + TypeScript (strict). Vitest for unit tests. Deployed to GitHub Pages via a GitHub Actions workflow.

## Layout
src/scene/      drawFrame, geometry, easing, storyboard timings (no React here)
src/export/     frame capture, GIF worker, share and download helpers
src/papers/     bundled papers, upload + crop, IndexedDB storage
src/ui/         React components (Composer, Preview, PaperPicker, MessageInput)
public/papers/  starter paper images (square JPGs, 1024 px)

## Conventions
- Config type: { message: string; paper: ImageBitmap | HTMLImageElement; slipColor: string; inkColor: string; fontFamily: string; background: string }
- Pose (internal to src/scene/pose.ts) carries gripX/gripY/slipAngle/slipScale/slipLayer for the slip, plus sceneRotation/fold1/fold2 — no paperOpacity/textOpacity/slipOpacity, since paper and text are always fully opaque.
- Storyboard timings live in one constant in src/scene/timeline.ts.
- Every phase ends with: typecheck passes, tests pass, Progress section below updated.

## Progress
- [x] Phase 0 Scaffold
- [x] Phase 1 Static scene
- [x] Phase 2 Animation
- [x] Phase 3 Composer UI
- [x] Phase 4 GIF export
- [ ] Phase 5 Share + PWA
- [ ] Phase 6 Paper library
- [ ] Phase 7 Polish
