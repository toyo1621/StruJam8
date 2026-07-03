# StruJam8 Deployment Runbook

This runbook describes the current GitHub Pages release path for StruJam8.

## Target

- Production URL: https://toyo1621.github.io/StruJam8/
- Workflow: `.github/workflows/pages.yml`
- Build output: `dist/`
- Pages base path: `/StruJam8/` via `npm run build:pages`

## Local Validation

Run both checks before merging release-related changes. Run them sequentially because both commands write `dist/`:

```bash
npm run check
npm run check:pages
```

`npm run check` validates the normal local/root build. `npm run check:pages` validates the GitHub Pages build with the `/StruJam8/` asset base path and should be the final command before inspecting `dist/index.html`.

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
- Adding a technique updates the rules list and Strudel Code panel.
- LocalStorage restore still works after refresh.
- Play/Stop is still presented as UI-only, not audio playback.

## Troubleshooting

- Blank page with missing JS/CSS usually means the Pages base path is wrong. Re-run `npm run check:pages` and inspect `dist/index.html`.
- A failed deploy with permission errors usually means repository Pages settings are not set to GitHub Actions.
- A successful deploy with stale UI may be browser cache. Hard refresh before debugging code.

## Current Limits

- No audio runtime is deployed yet.
- No custom domain is configured.
- Demo screenshots/GIF assets are planned in `docs/demo.md` but are not captured yet.
