# StruJam8 Demo Capture Guide

This guide defines the screenshots and short demo flow for README, release notes, and social previews.

The app now has a first Play/Stop audio preview through `@strudel/web`. Default presets use built-in synth/noise sounds only. Do not imply external sample-pack support yet.

## Setup

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, usually:

```text
http://127.0.0.1:5173/
```

Before capture, clear previous local state if you need a clean first-run view:

```js
localStorage.removeItem("strujam8:jam:v1")
```

## Recommended Assets

Save captured files under `docs/assets/` with these names:

- `strujam8-home.png`: first view with Toy House selected and no rules.
- `strujam8-rules-code.png`: rules added, rule detail visible, audible code populated, and active line highlighting visible during playback.
- `strujam8-sharing.png`: header showing Export JSON, Import JSON, Share URL, and Copy controls.
- `strujam8-tablet.png`: tablet-width layout check.
- `strujam8-demo.gif`: short interaction loop.

## Screenshot States

### 1. Home / First Run

Viewport: `1440 x 1000`.

State:

- Preset: Toy House.
- No rules.
- Path display: HOME.
- Eight target pads visible.
- Code panel shows Toy House base code.

Check:

- STRUJAM8 brand is visible.
- Preset selector is visible.
- Play/Stop controls are visible and can be presented as first audio preview controls.
- Dark background and colorful pads are clear.

### 2. Rules + Code Preview

Viewport: `1440 x 1000`.

Action script:

1. Select `ベース`.
2. Select `崩す`.
3. Select `音を抜く`.
4. Select `歪ませる`.
5. Open the detail view for one rule if it is not already selected.

Expected view:

- Rule list contains at least two rules.
- Selected-rule detail panel is visible.
- Code panel shows the same audible code used by Play and groups the bass snippets as a chain.
- TODO badges appear only for unverified snippets.

### 3. Persistence / Sharing Controls

Viewport: `1440 x 1000`.

State:

- Keep the rules from the previous screenshot.
- Header controls show `Export JSON`, `Import JSON`, and `Share URL`.
- Code panel shows the `Copy` button.
- Optional: click `Share URL` or `Copy` so a short status chip is visible.

Check:

- Controls fit without overlapping the preset selector or transport controls.
- Status labels are readable.
- Code remains selectable/readable.

### 4. Tablet Layout

Viewport: `1024 x 768`.

State:

- Use the same two-rule bass state.
- Verify that rule list, code panel, path display, and pad dock are all readable.

Check:

- No text overlaps.
- Header controls wrap cleanly if needed.
- Eight pads keep stable dimensions.
- Code panel remains usable.

## Demo GIF Flow

Target length: 8 to 12 seconds.

Suggested flow:

1. Start on HOME with Toy House.
2. Click `ベース` -> `崩す` -> `音を抜く`.
3. Show the rule appearing and code updating.
4. Add `歪ませる`.
5. Switch preset to Neon Dub.
6. Click `Share URL` or `Copy` to show feedback.

If showing Play/Stop, describe it as a first built-in synth/noise preview. Avoid implying that remote sample packs or every generated snippet is fully verified.

## Release Checklist

- Capture desktop and tablet screenshots after `npm run check` passes.
- Re-capture assets when header controls, pad layout, or code panel behavior changes.
- Keep filenames stable so README links do not churn.
- Do not commit screenshots that show local browser extensions, private URLs, or unrelated desktop UI.
