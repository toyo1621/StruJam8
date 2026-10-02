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

Source-location verification uses the Vite development server. Start
`npm run dev` in another terminal, then run:

```bash
npm run verify:techniques
npm run verify:highlighting
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
3. The build job calls `.github/workflows/ci.yml`, the same reusable validation used by CI: production dependency audit, unit tests, TypeScript/root build, root Chromium tests, Pages build/Chromium tests, all-technique evaluation and highlighting verification.
4. Only after every check passes, it removes `dist/StruJam8/` (the preview-only copy), generates `dist/release.json` with the commit SHA and SHA-256 hashes of the tested files, and uploads the remaining `dist/` as the Pages artifact. There is no untested rebuild after browser validation.
5. The deploy job depends on successful validation and publishes that artifact. Only this job receives `pages: write` and `id-token: write`; tests have read-only repository access.

The workflow can also be started manually with `workflow_dispatch`.

## Post-Deploy QA

Check the Pages run is successful for the intended commit. Fetch
`https://toyo1621.github.io/StruJam8/release.json` and compare its `commit` with that SHA.
For release-parity proof, fetch the files listed in `sha256` and compare their SHA-256
digests with the manifest. HTTP 200 alone does not establish which release is served.

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
- The initial page does not load the Strudel runtime; Play loads it after a user click and starts the first audio preview. The production build uses the Strudel source entry and disables eager module-preload handling so this boundary remains real. If that module load fails, Retry uses a separate query-keyed module URL to bypass the failed browser module cache. Stop hushes playback and suspends the current AudioContext; the next Play waits for suspension and resumes it. If a browser has already closed the context, a fresh one is created. Context reset clears the stale Superdough controller and global effects. Runtime Strudel event locations highlight the corresponding code tokens while playing, and audio output/scheduler failures stop playback with a retryable UI state; a line pulse is used as fallback.
- At a 360px mobile viewport, the pad dock has no horizontal overflow and primary controls retain at least a 44px touch target.

## Troubleshooting

- Failed tests or a high/critical production dependency advisory stop artifact upload and deployment. Fix the cause; do not bypass the reusable CI job to publish.

- Blank page with missing JS/CSS usually means the Pages base path is wrong. Re-run `npm run check:pages` and inspect `dist/index.html`.
- A failed deploy with permission errors usually means repository Pages settings are not set to GitHub Actions.
- A successful deploy with stale UI may be browser cache. Hard refresh before debugging code.

## Rollback

Revert the faulty commit on `main` with a new commit and push it. The full validation
gate must pass again before the reverted release is deployed. Do not force-push or
replace the gate with a deploy-only workflow. If the gate is failing, the last successful
Pages deployment stays live; it is not proof that the latest commit was published.

## Current Limits

- Audio runtime is an early `@strudel/web` preview. Default presets use built-in synth/noise sounds; external sample packs are not loaded by default.
- No custom domain is configured.
- Desktop, rules, and tablet PNG assets are committed under `docs/assets/`; the short demo GIF remains planned in `docs/demo.md`.
