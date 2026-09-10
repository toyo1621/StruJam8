# StruJam8 Deployment Runbook

This runbook describes the current GitHub Pages release path for StruJam8.

## Target

- Production URL: https://toyo1621.github.io/StruJam8/
- Workflow: `.github/workflows/pages.yml`
- Build output: `dist/`
- Pages base path: `/StruJam8/` via `npm run build:pages`

## Local Validation

Run all release checks before merging. Run the build checks sequentially because they write `dist/`, then run the browser checks:

```bash
npm run check
npm run check:pages
npm run test:e2e
npm run test:e2e:pages
```

`npm run check` validates the normal local/root build. `npm run check:pages` validates the GitHub Pages build with the `/StruJam8/` asset base path and should be the final command before inspecting `dist/index.html`.
`npm run test:e2e:pages` serves the built artifact under `/StruJam8/` and runs the browser flow against the production-shaped preview.

After `npm run check:pages`, inspect `dist/index.html` and confirm generated asset URLs begin with `/StruJam8/assets/`.

## One-Time Repository Setup

In the GitHub repository settings:

1. Open Settings -> Pages.
2. Set Build and deployment Source to GitHub Actions.
3. Save the setting.

The workflow has the required Pages permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

## Deploy Flow

1. Merge or push to `main`.
2. GitHub Actions runs `.github/workflows/pages.yml`.
3. The build job runs `npm ci` and `npm run check:pages`.
4. The workflow uploads `dist/` as a Pages artifact.
5. The deploy job publishes the artifact to GitHub Pages.

The workflow can also be started manually with `workflow_dispatch`.

## Post-Deploy QA

Open https://toyo1621.github.io/StruJam8/ and check:

- The app loads without a blank screen.
- CSS is applied and the dark UI is visible.
- Source and License links open the expected GitHub pages.
- Pads navigate target -> intent -> technique.
- Adding a technique updates the rules list and the audible Strudel Code panel.
- While playing, adding/toggling/removing a playable technique updates the audible preview.
- Changing preset or importing a jam stops current playback.
- Share URL copies a URL that restores the current small jam; oversized jams show an Export JSON fallback instead of copying an unusable URL.
- LocalStorage restore still works after refresh.
- The initial page does not load the Strudel runtime; Play loads it after a user click and starts the first audio preview. If that module load fails, Retry uses a separate query-keyed module URL to bypass the failed browser module cache. Stop hushes playback and closes the current AudioContext; the next Play waits for close completion and creates a fresh context. Suspended AudioContexts are resumed, and context reset clears the stale Superdough controller and global effects. Runtime Strudel event locations highlight the corresponding code tokens while playing, and audio output/scheduler failures stop playback with a retryable UI state; a line pulse is used as fallback.
- At a 360px mobile viewport, the pad dock has no horizontal overflow and primary controls retain at least a 44px touch target.

## Troubleshooting

- Blank page with missing JS/CSS usually means the Pages base path is wrong. Re-run `npm run check:pages` and inspect `dist/index.html`.
- A failed deploy with permission errors usually means repository Pages settings are not set to GitHub Actions.
- A successful deploy with stale UI may be browser cache. Hard refresh before debugging code.

## Current Limits

- Audio runtime is an early `@strudel/web` preview. Default presets use built-in synth/noise sounds; external sample packs are not loaded by default.
- No custom domain is configured.
- Desktop, rules, and tablet PNG assets are committed under `docs/assets/`; the short demo GIF remains planned in `docs/demo.md`.
