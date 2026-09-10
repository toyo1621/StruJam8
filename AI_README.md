# StruJam8 AI README

This document is for AI agents and developers continuing work on StruJam8.
Use this alongside README.md. README.md is product-facing; this file is implementation-facing.

## Project Summary

StruJam8 is an MVP for an open-source visual jam interface for Strudel.
The current priority is UI, state management, code-generation experience, and cautious first playback.
The app has a first Play/Stop audio preview through `@strudel/web`. While Play is active, changes to the audible code are re-evaluated so the right code panel, copied code, and evaluated code stay aligned. Default presets use built-in synth/noise sounds only; external sample packs are not loaded by default yet.

Primary user flow:

1. Select a target sound.
2. Select an intention.
3. Select a technique.
4. Add a rule.
5. Show the audible Strudel code in the right code panel. The visible code, copied code, and Play input should stay identical.
6. If Play is active, audible code changes should re-evaluate the Strudel preview instead of silently diverging.

## Current Workspace

Primary project path used in recent work:

```text
/Users/to-sasaki/Desktop/dev/git/StruJam8
```

Remote repository:

```text
https://github.com/toyo1621/StruJam8.git
```

## Commands

```bash
npm install
npm run dev
npm test
npm run build
npm run build:pages
npm run check
npm run check:pages
npm run test:e2e
npm run test:e2e:pages
npm run verify:techniques
npm run verify:highlighting
```

The Vitest suite covers route lookup, technique lookup, concrete route completeness, concrete route uniqueness, all-target route coverage, all-intent route coverage, required learning copy, project source/license link metadata, accessibility labels, live pad color contrast, keyboard shortcut mapping and interaction guards, screen reader announcement formatting, clipboard helpers, persistence parsing, share URL encoding, app reducer transitions, rule duplication, rule ordering, undo/redo behavior, generated code formatting, code highlighting, code tokenization, code-location merging and mapping, the Strudel audio engine boundary, and browser-like React interactions through Testing Library + jsdom, including audio retry recovery. Playwright adds real-browser checks for the three-level route, all concrete route reachability, one verified playback technique from every concrete route, the 28-technique runtime-verified playback batch, code update, RESET behavior, safe exclusion of unverified snippets, real invalid-snippet failure recovery, tablet-width overflow, narrow mobile touch controls, browser audio start/stop, live code highlighting across a representative route for all eight target tracks, runtime-load Retry recovery, the lazy-loading boundary that keeps the Strudel runtime out of the initial page load, and the same flows against a Pages-base-path production preview.
Use `npm run check` as the normal local validation gate; it runs `npm test` and `npm run build`. Use `npm run check:pages` before deployment-related changes; it validates the GitHub Pages build base path. Use `npm run verify:techniques` and `npm run verify:highlighting` with the local Vite server running to evaluate every technique definition and measure its runtime source-location signals. Reducer behavior is covered by unit tests.

## Architecture

### Main Files

- `src/App.tsx`: React state, navigation, rule creation, generated code output, transport calls, and pad preview UI.
- `src/components/AppErrorBoundary.tsx`: catches unexpected render failures and provides a reload action.
- `src/audio/strudelEngine.ts`: small boundary around `@strudel/web` init/evaluate/hush, runtime event locations, and evaluation errors.
- `src/components/RuleDetailPanel.tsx`: compact selected-rule learning panel.
- `src/App.css`: visual layout, dark theme, colorful pads, responsive behavior.
- `vite.config.ts`: Vite React config; GitHub Pages uses the `build:pages` script for the `/StruJam8/` base path. Production builds use the `@strudel/web` source entry so `@strudel/core` is shared once, keep one lazy `strudel-runtime` chunk, and preserve a query-keyed Retry import so a failed module cache can be bypassed without shipping the runtime twice. The custom output pass removes Vite's preload wrapper because it would otherwise eagerly fetch the lazy audio chunk.
- `playwright.config.ts` and `e2e/app.spec.ts`: Chromium-backed browser flow and responsive layout checks.
- `vitest.config.ts`: limits unit/component discovery to `src/` so Playwright files are not run by Vitest.
- `.github/workflows/ci.yml`: GitHub Actions workflow running `npm run check` and the Playwright browser checks.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `CONTRIBUTING.md`: contributor setup, validation, PR checklist, and scope guidance.
- `docs/demo.md`: screenshot and demo GIF capture instructions for release assets.
- `docs/deployment.md`: GitHub Pages deployment runbook and post-deploy QA checklist.
- `docs/release-readiness.md`: current functional/non-functional requirement evaluation, release evidence, and development order.
- `docs/license-review.md`: AGPL license decision notes and upstream Strudel license check.
- `docs/technique-design.md`: technique design principles, route priority, and route expansion rules.
- `LICENSE`: GNU Affero General Public License version 3 text.
- `src/types.ts`: shared data contracts.
- `src/data/pads.ts`: target and intent pad definitions plus route-specific technique pad lookup.
- `src/data/padColors.ts`: shared live pad palette, text color, and minimum contrast target.
- `src/data/presets.ts`: static preset metadata, base code, and preset track patterns.
- `src/data/starterJam.ts`: the beginner starter rule recipe shown in the empty rule state.
- `src/data/projectLinks.ts`: source and license links shown in the app header.
- `src/data/routes.ts`: explicit concrete target/intent route definitions and route lookup helpers.
- `src/data/tracks.ts`: track metadata and starter pattern templates for all eight targets.
- `src/data/techniques.ts`: technique definitions with descriptions, Strudel-like snippets, and plain-language snippet explanations.
- `src/lib/accessibilityLabels.ts`: pure labels for rule actions and transport controls.
- `src/lib/announcements.ts`: pure screen reader announcement formatting helpers.
- `src/lib/clipboard.ts`: clipboard copy helpers with success/failure states.
- `src/lib/colorContrast.ts`: pure WCAG-style contrast helpers used by pad palette tests.
- `src/lib/codegen.ts`: pure formatting helpers for audible Strudel code and conservative runtime playback code.
- `src/lib/codeHighlight.ts`: pure helpers for active target and rule-snippet highlighting.
- `src/lib/codeTokens.ts`: lossless tokenization for syntax-colored Strudel-like code.
- `src/lib/codeLocations.ts`: merges simultaneous Strudel event locations and maps source ranges to rendered code lines and tokens.
- `src/lib/keyboard.ts`: pure keyboard shortcut helpers and editing-control guards.
- `src/lib/persistence.ts`: localStorage and JSON snapshot parse/serialize helpers.
- `src/lib/shareUrl.ts`: URL snapshot sharing helpers using the `jam` query parameter, including a practical length guard.
- `src/state/appReducer.ts`: reducer for navigation, rules, and transport UI state.

### State Model

Current state is owned by `src/state/appReducer.ts` and consumed by `App.tsx`:

- `currentLevel: "target" | "intent" | "technique"`
- `selectedTarget: RouteSelection<TargetId> | null`
- `selectedIntent: RouteSelection<IntentId> | null`
- `selectedPresetId: PresetId`
- `rules: Rule[]`
- `ruleHistory: Rule[][]`
- `ruleFuture: Rule[][]`
- `isPlaying: boolean`

Active technique pad highlighting is derived from enabled rules, not stored separately.

The Play button initializes Strudel from a user click and evaluates conservative playable code. The `@strudel/web` runtime is dynamically imported at that point, so the initial UI does not pay the full audio bundle cost. If the first module load fails, the next Retry uses a separate query-keyed module URL to bypass the browser's failed ES-module cache. Stop calls `hush()` through the audio boundary, suspends the current browser AudioContext, and resets the Superdough controller/effect state; the next Play waits for suspension and resumes the same context. If a browser has already closed the context, the next Play still follows the closed-context recovery path and creates a fresh one. While `isPlaying` is true, `App.tsx` re-evaluates the current audible code when it changes. Preset changes and JSON imports stop playback before swapping state. The `isPlaying` state reflects the UI transport status, not a full low-level audio graph status.

### Technique Data Contract

`TechniqueDefinition` has:

- `id`
- `label`
- `shortLabel`
- `targetId`
- `intentId`
- `target`
- `intent`
- `description`
- `strudelSnippet`
- `snippetExplanation`
- `playbackTransform?`
- `needsTodo?`

Use `needsTodo: true` when a snippet is plausible but not verified against real Strudel behavior.
The technique preview and rule detail display a TODO badge, while conservative Play code excludes the snippet until it is verified. The pad preview displays `snippetExplanation` beside the snippet.

### Route Data Contract

`RouteDefinition` has:

- `targetId`
- `intentId`
- `target`
- `intent`
- `description`

Concrete target/intent routes are listed in `src/data/routes.ts`. Every concrete route must have exactly eight techniques, and tests enforce this.

## Functional Requirements Evaluation

### Implemented

- Three-level navigation: target -> intent -> technique.
- Eight visible pads at each level.
- Back, Home, Undo, Redo, and Reset controls; RESET clears added rules, preserves the current navigation location and preset, and can be undone/redone.
- Rule creation when a technique is selected.
- Beginner starter jam action that adds two safe example rules as one undoable change.
- Rule list display.
- Rule deletion, duplication, ON/OFF toggling, reordering, undo, and redo for rule changes.
- Intent-level route guide plus technique preview and compact rule detail panels with descriptions, snippets, plain-language snippet explanations, short labels, and TODO badges.
- The data-driven technique catalog has 37 concrete routes across all eight target families and all eight intent families; route expansion is documented in `docs/technique-design.md`.
- Concrete route definitions are centralized in `src/data/routes.ts`.
- Track templates exist for all eight target tracks and avoid sample/soundfont names by default.
- Enabled safe rules are grouped by track and chained against track templates in the audible code panel.
- Toy House and Neon Dub preset selection with synth-safe preset-specific base code.
- Local browser persistence restores rules and selected preset on reload.
- Jam snapshots can be exported and imported as validated JSON files.
- Small jams can be shared through a copied URL containing a validated `jam` parameter; oversized jams are directed to JSON export.
- Track-composed audible Strudel output for implemented techniques.
- First Strudel audio preview through Play/Stop using `@strudel/web`.
- Conservative playback code generation starts from the preset playback tracks and skips disabled rules, missing snippets, and snippets marked `needsTodo`.
- The right code panel, copied code, and Play input all use the same audible code string, including route comments immediately above playable technique chains.
- Active playback re-evaluates when the audible code string changes, keeping sound and displayed code closer during live edits.
- The code panel tokenizes functions, strings, numbers, punctuation, and comments, then highlights runtime Strudel event locations at token level while playing, with a target/rule pulse fallback.
- The rule list derives active rule IDs from the same rendered code lines and marks currently producing rules with a `LIVE` state; broad target-level runtime locations fall back to all rules on that target.
- Audible code can be copied to the clipboard from the code panel.
- Fallback technique pads for undefined target/intent combinations.
- Basic responsive layout for desktop, tablet, and narrow screens.
- Number-key shortcuts for live pads 1-8, with tested guards for editable controls and modified key events.
- Visible focus states for keyboard navigation.
- Named control groups, 44px touch targets for primary controls, and reduced-motion CSS support.
- Screen reader status announcements for rule changes.
- Rule action buttons include full-route accessible labels, and Play/Stop/Retry labels describe the Strudel audio preview.
- Live pad text color contrast is guarded by tests against the shared target, intent, and technique palette.
- Visible Source and License links in the app header for release readiness.

### Partially Implemented

- Play/Stop/Retry: first audio preview only; it initializes Strudel, evaluates the same audible code shown in the right panel, serializes updates so the latest request wins, re-evaluates on audible code changes while playing, suspends the current AudioContext on Stop, resumes it before the next evaluation, recreates a fresh context when the browser has already closed the old one, clears the stale Superdough controller and global effects during context reset, stops UI playback when evaluation, output, or scheduler errors are reported, and exposes a visible Retry state after a recoverable failure. Real invalid-snippet failure and recovery are covered by browser E2E, but it is still not full strudel.cc transport parity.
- Strudel code generation: selected snippets are grouped by track and chained against track templates. Runtime playback uses a stricter formatter that starts from preset playback tracks and omits disabled, missing, and unverified snippets.
- Active code highlighting: syntax-colored tokens plus merged runtime Hap source-location highlighting are implemented, with evaluator `miniLocations` forwarded into the UI to refine the active source leaves. The left rule list derives from the same active rendered lines and shows a synchronized `LIVE` state, falling back to the active target when locations are broad. A representative browser smoke covers all eight target tracks, a playback smoke covers one verified technique from every concrete route, and a 28-technique runtime-verified playback batch is included. All 296 catalog snippets also pass the installed Strudel evaluator through `npm run verify:techniques`; `npm run verify:highlighting` confirms `miniLocations` for 296/296 and observes runtime event locations for 295/296 in a 500ms window, with the remaining rest-oriented technique documented as potentially silent. Exact strudel.cc editor rendering/state parity remains pending.
- Technique catalog: 37 real routes have concrete snippets, covering every target and every intent at least once:
  - ドラム -> 踊らせる
  - ドラム -> 盛り上げる
  - ドラム -> 抜く
  - ドラム -> 崩す
  - ドラム -> チル
  - ドラム -> ランダム感
  - ドラム -> 前に出す
  - ドラム -> 広げる
  - ベース -> 崩す
  - ベース -> 踊らせる
  - ベース -> 盛り上げる
  - ベース -> 抜く
  - ベース -> チル
  - ベース -> 前に出す
  - ベース -> ランダム感
  - ベース -> 広げる
  - コード -> 盛り上げる
  - コード -> チル
  - コード -> 広げる
  - コード -> 抜く
  - コード -> 崩す
  - コード -> 前に出す
  - コード -> ランダム感
  - コード -> 踊らせる
  - キーボード -> チル
  - キーボード -> ランダム感
  - キーボード -> 広げる
  - キーボード -> 前に出す
  - ストリングス -> 広げる
  - ストリングス -> 前に出す
  - ベル -> ランダム感
  - ベル -> 広げる
  - ギター -> 前に出す
  - ギター -> 踊らせる
  - ボイス -> 前に出す
  - ボイス -> 広げる
  - ボイス -> ランダム感
- Learning experience: intent-level route descriptions, technique descriptions, snippets, and plain-language snippet explanations are visible in the pad preview and selected rule detail. A first starter jam connects two explanations to the generated code, but there is no full guided mode or code walkthrough yet.
- Selection feedback: selected technique pads are outlined for active rules, and rules can be duplicated, removed, toggled on/off, reordered, undone, and redone. Parameter-level editing is not implemented yet.
- Target and intent coverage: all eight target families and all eight intent families now have at least one concrete target/intent route.

### Missing

- Exact strudel.cc editor metadata/state parity beyond the currently consumed evaluator `miniLocations`, plus location coverage for techniques that do not carry mini notation.
- Full normal-stop AudioContext disposal and error-specific recovery for invalid snippets and unrecoverable runtime failures; normal Stop suspends the context and resets the global audio graph, while real invalid-snippet failure/recovery and runtime-load failure recovery are covered by browser E2E.
- External sample-pack and soundfont loading after license review.
- Parameter editing for existing rules.
- User-defined presets and named preset saving.
- URL sharing of large jams beyond the practical length limit; the UI intentionally directs those jams to JSON export.
- MIDI/controller input.
- Full event-window coverage for techniques that intentionally begin with silence; the representative all-eight-target smoke, one-verified-technique-per-route playback smoke, 296-snippet evaluator verification, 296/296 `miniLocations` verification, 295/296 runtime event-location observation, safe-exclusion checks, real invalid-snippet failure/recovery, audio start/stop, lazy loading, and runtime-load Retry recovery are covered by the documented checks.
- Accessibility pass beyond basic semantic buttons and labels.
- Full error telemetry or remote crash reporting; the current boundary logs locally and offers reload.
- Error-specific recovery for invalid snippets and unrecoverable runtime scheduler errors remains pending; real invalid snippets stop playback and expose Retry, runtime-load Retry bypasses a failed module cache, and closed AudioContexts are recreated before the next Play attempt.

## Non-Functional Requirements Evaluation

### Maintainability

Current level: decent for MVP.

Strengths:

- Technique data is separated from UI.
- Concrete route completeness, route uniqueness, and all-target coverage are validated by tests.
- Target and intent selections now use stable IDs internally.
- Generated code formatting is separated into `src/lib/codegen.ts`.
- Rule grouping and composed track preview formatting are tested.
- Track metadata is centralized in `src/data/tracks.ts`.
- Preset definitions are centralized and validated by tests.
- Persistence parsing, storage writes, and JSON snapshot serialization are isolated in `src/lib/persistence.ts` and tested.
- Clipboard copy behavior is isolated in `src/lib/clipboard.ts` and tested.
- Share URL encoding/decoding is isolated in `src/lib/shareUrl.ts` and tested.
- Local quality gates run `npm run check`, `npm run test:e2e`, `npm run test:e2e:pages`, `npm run verify:techniques`, and `npm run verify:highlighting`; CI runs the unit/build gate, both browser suites, and the source-location verification against a temporary Vite server, while the GitHub Pages workflow runs `npm run check:pages` for the deployment build.
- Contributor setup and PR expectations are documented in `CONTRIBUTING.md`.
- Demo capture states are documented in `docs/demo.md`.
- Deployment setup and post-deploy QA are documented in `docs/deployment.md`.
- Shared types exist.
- The app is small and easy to inspect.
- The selected-rule detail view is isolated in a focused component.

Risks:

- `App.tsx` still owns navigation, rule creation, and most rendering.
- Technique IDs and fallback IDs are still string values and should remain stable.
- Rule state transitions are centralized in a reducer, including order changes and undo/redo stacks for rule operations.
- No lint formatter gate exists yet.

Recommended direction:

- Keep target/intent IDs stable as the catalog expands.
- Keep reducer actions small and explicit as interactions grow.
- Keep catalog validation strict as more concrete routes are added.
- Keep CONTRIBUTING.md aligned with the active architecture and validation commands.
- Keep demo assets current when header, pad dock, or code panel layout changes.

### Scalability

Current level: fine for 296 techniques, 8 track templates, 2 static presets, one local jam snapshot, JSON import/export, and small URL snapshots; fragile for hundreds.

Strengths:

- Duplicate technique IDs, route uniqueness, concrete route completeness, all-target route coverage, and all-intent route coverage are covered by tests.
- Track template coverage is validated by tests.
- Preset coverage is validated by tests.
- Saved jam snapshots are versioned and invalid saved rules are filtered on load.
- JSON import uses the same versioned snapshot validation as localStorage.
- Share URL import uses the same versioned snapshot validation as JSON import.
- Explicit target, intent, and route definition types exist.

Risks:

- All data is static arrays.
- Composition semantics are still simple ordered chaining and may need stronger musical rules later.
- localStorage is browser-local and not a cross-device save system.
- Browser clipboard permissions can still deny copy requests.
- URL sharing is convenient for small jams; the `shareUrl` helper and App guard block oversized URLs and direct users to JSON export.

Recommended direction:

- Expand catalog validation tests as route definitions grow beyond the first all-target coverage pass.
- Treat techniques as data that can later be loaded from JSON or user packs.

### Reliability

Current level: acceptable for early playback MVP.

Risks:

- Rule IDs use `crypto.randomUUID()` with a `Date.now()` fallback.
- Strudel snippets are strings and not validated.
- RESET semantics are tested and announced, but users may still expect it to return home because the visible label is intentionally compact.
- localStorage access is guarded and malformed snapshots are ignored.

Recommended direction:

- Consider deterministic IDs only if future persistence requires predictable references.
- Add stricter snippet validation as runtime playback expands beyond the conservative formatter.
- Keep RESET semantics visible in tests and accessibility copy as rule editing grows.

### Usability

Current level: promising, but early.

Strengths:

- The 8-pad model is simple.
- The current path display makes hierarchy understandable.
- The code panel gives immediate feedback.
- The empty rule state offers a safe two-rule starter jam that can be undone as one action.
- Technique preview makes concrete technique meaning inspectable before selection on pointer and keyboard focus.
- Selected rule detail makes added rules readable after selection.
- Snippet explanations translate small Strudel fragments into plain Japanese.
- Copy status gives immediate feedback when code copy succeeds or fails.

Risks:

- Fallback routes still show generic placeholder techniques, but the intent-level guide now labels them as prototype routes before selection.
- Rule editing supports duplication plus undo and redo, but only for rule-list state changes.
- The generated snippet format is readable but not yet musically actionable.

Recommended direction:

- Keep improving fallback explanations as real routes are added.
- Consider per-rule parameter editing once duplication and undo/redo feel stable in real use.
- Expand the starter jam into guided examples that connect more snippet explanations to the generated code panel.

### Accessibility

Current level: improving.

Strengths:

- Controls are real buttons.
- Main regions have labels/headings.
- Live pads can be triggered with number keys 1-8, and shortcut guards avoid firing while users type in editable controls.
- Focus states are visually stronger than browser defaults.
- Rule changes are announced through an aria-live status region.
- Rule action buttons expose full-route accessible labels.
- Play/Stop controls expose the first Strudel audio preview behavior.
- Live pad foreground/background contrast is guarded by a WCAG-style test for the shared palette.

Risks:

- Color is still a major visual cue, but pads also use labels and the shared palette is covered by contrast tests.
- Rule list actions are keyboard reachable and labeled, but not optimized for fast keyboard workflows.

Recommended direction:

- Add visible focus states: done for main buttons, rule actions, and live pads.
- Add number-key shortcuts 1-8 for pads: done.
- Ensure contrast remains strong on all pad colors: guarded by the live pad contrast test.
- Add aria-live feedback for added rules: done for add, remove, toggle, move, undo, redo, and reset.

### Performance

Current level: no issue.

Risks later:

- Audio integration and live code regeneration may introduce timing issues.
- Large rule lists may need better layout behavior.

Recommended direction:

- Keep generated code derived from state, not manually synchronized.
- Keep audio update boundaries explicit as Strudel runtime usage expands.

### Legal / Licensing

Current level: selected for MVP.

Strengths:

- `LICENSE` is present with GNU AGPL version 3 text.
- `package.json` uses the SPDX expression `AGPL-3.0-or-later`.
- `docs/license-review.md` records the 2026-07-04 Strudel package license check and rationale.
- The app header exposes Source and License links through `src/data/projectLinks.ts`.
- Attribution is clear: this is not an official Strudel project.

Risks:

- This is a project decision, not legal advice.
- License compatibility should be re-checked before loading external sample packs, changing runtime packages, deploying a hosted public service, or accepting large third-party contributions.

Recommended direction:

- Keep license metadata, README, CONTRIBUTING.md, and package metadata aligned.
- Keep visible source/license links in the app before any hosted public release.

## Development Direction

### Phase 1: Stabilize the MVP Data Model

Goal: make the app safe to expand without rewriting basics.

Tasks:

- Stable IDs for targets and intents: done.
- ID-based route matching: done.
- `src/lib/codegen.ts` for generated code formatting: done.
- Navigation/rule state reducer: done.
- Rule remove/disable controls: done.
- Rule duplication: done.
- Rule reordering: done.
- Undo for rule changes: done.
- Redo for undone rule changes: done.
- Basic tests for technique lookup, rule duplication, rule ordering, undo/redo, and code generation: done.
- Add clear RESET semantics: done; RESET clears rules only, preserves navigation and preset, and is undoable/redoable.

### Phase 2: Improve the Learning Experience

Goal: make StruJam8 teach Strudel while users play.

Tasks:

- Show `description` for the currently highlighted technique: done.
- Show concrete/prototype route descriptions before choosing an intent: done.
- Show short labels on pads where useful, but preserve full labels for readability: done.
- Add plain-language explanations beside snippets: done in the pad preview.
- Add a first guided example: done with the starter jam action; broader guided examples remain pending.
- Add TODO badges for unverified snippets: done in the pad preview, rule list, and rule detail panel; unverified snippets are skipped by Play.
- Add a compact rule detail view: done.

### Phase 3: Expand Musical Coverage

Goal: make the 8-pad system musically useful across all targets.

Tasks:

- Define real techniques for more target/intent routes: first target coverage pass done, then intent coverage pass added ドラム -> 抜く, ベース -> 踊らせる, コード -> チル, and キーボード -> ランダム感. Core expansion then added ドラム -> 崩す, ベース -> 盛り上げる, and コード -> 広げる. Reduction expansion then added ベース -> 抜く, コード -> 抜く, and ドラム -> チル. Core contrast/surprise expansion then added ベース -> チル, コード -> 崩す, and ドラム -> ランダム感. Forward expansion then added ドラム -> 前に出す, ベース -> 前に出す, and コード -> 前に出す. Upper-layer widen expansion then added キーボード -> 広げる, ベル -> 広げる, and ボイス -> 広げる. Core space/surprise expansion then added ドラム -> 広げる, ベース -> ランダム感, and コード -> ランダム感. Core movement expansion then added ベース -> 広げる, コード -> 踊らせる, and キーボード -> 前に出す. Decorative movement expansion then added ストリングス -> 前に出す, ギター -> 踊らせる, and ボイス -> ランダム感. Current catalog has 37 concrete routes and 296 techniques.
- Create track templates for drums, bass, chords, keys, strings, bells, guitar, and voice: done.
- Decide how multiple snippets compose for the same track: done for preview output with ordered per-track chaining.
- Add presets beyond Toy House: done with a second static preset, Neon Dub.

### Phase 4: Strudel Runtime Integration

Goal: make Play/Stop real.

This phase is now active. `@strudel/web` has been added after explicit user request.

Tasks:

- Research the current Strudel web/runtime integration path: done for `@strudel/web@1.3.0`.
- Add an audio engine boundary module instead of calling Strudel directly from UI components: done in `src/audio/strudelEngine.ts`.
- Implement start and stop lifecycle: first pass done with `initStrudel()`, `evaluate()`, and `hush()`.
- Implement serialized latest-request update lifecycle: done; Stop hushes playback, suspends the current AudioContext, waits for suspension before a new Play, and resets the stale Superdough controller and global effects.
- Handle invalid code safely: unverified snippets are excluded before Play, while evaluation, output, and scheduler errors are surfaced and stop UI playback; suspended contexts are resumed, closed contexts are recreated before retry, and a visible Retry state is shown. Real invalid-snippet evaluation and recovery are covered by browser E2E; error-specific recovery beyond the current retry behavior remains pending.
- Keep right-panel code, copied code, and Play input identical: done for audible code.
- Re-evaluate playback when the audible code changes while Play is active: done in `src/App.tsx`.
- Add a user gesture gate for browser audio permissions: first pass done by starting from the Play button click.
- Review external sample-pack licensing before enabling remote samples: pending.

### Phase 5: Persistence and Sharing

Goal: make jams saveable and shareable.

Tasks:

- Add localStorage persistence for rules and preset selection: done.
- Add export/import as JSON: done.
- Add copy-to-clipboard for generated code: done.
- Consider URL-encoded jams for sharing: done for small jams via the `jam` URL parameter.

### Phase 6: Release Readiness

Goal: prepare for external users and contributors.

Tasks:

- Choose final license and add LICENSE: done with `AGPL-3.0-or-later`; see `docs/license-review.md`.
- Add contribution guidelines: done in `CONTRIBUTING.md`.
- Add automated checks in GitHub Actions: done for unit/build validation via `npm run check`, development Chromium validation via `npm run test:e2e`, and Pages-base-path production validation via `npm run test:e2e:pages`.
- Add GitHub Pages deployment workflow: done in `.github/workflows/pages.yml`; it runs `npm run check:pages`, and repository Pages settings still need to allow GitHub Actions deployment. Runbook added in `docs/deployment.md`.
- Add screenshots or demo GIF: desktop/rules/tablet PNG assets and the short pad-to-code demo GIF are committed under `docs/assets/`; a sharing-controls screenshot remains pending.
- Add visible Source and License links in the app header: done via `src/data/projectLinks.ts`.
- Add deployment target: GitHub Pages selected; expected URL is `https://toyo1621.github.io/StruJam8/` after repository Pages settings are enabled.

## AI Agent Rules

When continuing development:

- Preserve the 8-pad mental model.
- Prefer data-driven additions in `src/data/techniques.ts` over hardcoded UI branches.
- Register concrete routes in `src/data/routes.ts` before adding route-specific technique data.
- Do not add Blockly yet unless explicitly requested.
- `@strudel/web` was added after explicit playback-phase request; keep Strudel calls isolated in `src/audio/strudelEngine.ts`.
- Keep generated code readable even before it becomes executable.
- Run `npm run check` before reporting completion when practical; at minimum run `npm test` and `npm run build`.
- If touching GitHub, check `git status -sb` first and avoid staging unrelated changes.
