# StruJam8

StruJam8 is an open-source visual jam interface for Strudel.

**音を選んで、動きを選んで、8パッドでジャムる。**

StruJam8は、Strudelのためのオープンソースなビジュアル・ジャムUIです。
8つのパッドで「対象 -> 意図 -> 手法」を選び、音のルールを作りながら演奏できます。
遊んでいるうちにStrudelコードが読めるようになることを目指します。

## Core Concept

- Choose a sound
- Choose an intention
- Choose a technique
- Jam with 8 pads
- Learn Strudel gradually

## Current Status

StruJam8 is currently an MVP focused on UI and state management.
Audio playback is not implemented yet.

Implemented:

- 8-pad navigation across three levels: target, intent, technique
- Rule list generated from selected techniques
- Rule ON/OFF toggling, duplication, deletion, reordering, reset, undo, and redo for rule changes
- Toy House and Neon Dub preset selection
- Local browser persistence for rules and preset selection
- JSON export/import for jam snapshots
- Shareable URL snapshots for small jams
- Track-composed Strudel-like code preview from selected techniques
- Copy generated Strudel-like code to clipboard
- Concrete technique routes for all eight targets: drums, bass, chords, keys, strings, bells, guitar, and voice
- Track templates for all eight targets
- Intent-level route guide plus technique preview and rule detail panels with descriptions, snippet explanations, short labels, and TODO badges
- Number-key shortcuts for live pads 1-8, with guards for editable controls
- Visible keyboard focus states
- Screen reader status announcements and full-route labels for rule actions, including reset semantics
- Live pad color contrast guarded by tests
- Visible source and license links for release readiness
- Dark interface with colorful live pads
- Responsive layout for desktop and tablet-sized screens

Not implemented yet:

- Real Strudel playback
- Blockly or visual programming blocks
- Pattern editing
- MIDI or controller input
- Full browser-level UI interaction tests

## Presets

The first preset is **Toy House**. A second static preset, **Neon Dub**, is available from the header selector.

Toy House starts with this base code:

```js
stack(
  s("bd*4"),
  s("~ cp ~ cp"),
  s("hh*8").gain(0.55),
  note("c2 ~ eb2 g2").s("sawtooth").gain(0.45),
  note("c4 eb4 g4 bb4").s("gm_electric_piano_1").slow(2).room(0.4)
)
```

Concrete routes currently include:

- ベース -> 崩す
- コード -> 盛り上げる
- ドラム -> 踊らせる
- ドラム -> 盛り上げる
- キーボード -> チル
- ストリングス -> 広げる
- ベル -> ランダム感
- ギター -> 前に出す
- ボイス -> 前に出す

When techniques are selected, StruJam8 groups them by track and appends a readable Strudel-like chain:

```js
/* ベース ＞ 崩す ＞ 音を抜く */
/* ベース ＞ 崩す ＞ 歪ませる */
bass:
  note("c2 ~ eb2 g2").s("sawtooth").gain(0.45)
    .degradeBy(0.2)
    .distort(0.4)
```

## Tech Stack

- Vite
- React
- TypeScript
- CSS
- Strudel concepts and snippets

Note: Strudel runtime packages are not installed in this MVP.

## Development

```bash
npm install
npm run dev
```

Test:

```bash
npm test
```

Build:

```bash
npm run build
```

Quality check:

```bash
npm run check
```

## Deployment

The app is configured for GitHub Pages at:

https://toyo1621.github.io/StruJam8/

The deployment workflow is defined in `.github/workflows/pages.yml`. It runs `npm run check:pages`, uploads `dist/`, and deploys through GitHub Pages. Local development still runs at the Vite root path. See [docs/deployment.md](docs/deployment.md) for the deployment runbook.

## Project Structure

```text
.github/
  workflows/ci.yml      GitHub Actions validation workflow
  workflows/pages.yml   GitHub Pages deployment workflow
src/
  App.tsx                Main UI and app state
  App.css                Visual design and responsive layout
  types.ts               Shared TypeScript types
  components/            Focused React UI components
  data/
    pads.ts              Target, intent, and visible pad data
    padColors.ts         Shared live pad palette and contrast target
    presets.ts          Preset metadata and base Strudel-like code
    projectLinks.ts      Source and license links shown in the app
    routes.ts            Concrete target/intent route definitions
    tracks.ts            Track metadata and starter pattern templates
    techniques.ts        Technique definitions and Strudel snippets
  lib/
    announcements.ts   Screen reader announcement formatting
    clipboard.ts       Clipboard copy helpers
    colorContrast.ts    Pad color contrast helpers
    codegen.ts           Generated Strudel-like code formatting
    keyboard.ts        Keyboard shortcut helpers
    persistence.ts     Local storage and JSON snapshot helpers
    shareUrl.ts        URL snapshot sharing helpers
  state/
    appReducer.ts        App state transitions and rule actions
docs/
  deployment.md          GitHub Pages deployment runbook
  license-review.md      License decision notes
```

## Demo Assets

See [docs/demo.md](docs/demo.md) for the screenshot and demo GIF capture plan.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, validation, and PR guidelines.

## Notice

This is not an official Strudel project.

## License

StruJam8 is licensed under `AGPL-3.0-or-later`. See [LICENSE](LICENSE).

The current license decision is documented in [docs/license-review.md](docs/license-review.md). Re-check compatibility before adding Strudel runtime packages or accepting large third-party contributions.
