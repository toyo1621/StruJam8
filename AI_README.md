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
```

A small Vitest suite covers route lookup, technique lookup, concrete route completeness, concrete route uniqueness, all-target route coverage, all-intent route coverage, required learning copy, project source/license link metadata, accessibility labels, live pad color contrast, keyboard shortcut mapping and interaction guards, screen reader announcement formatting, clipboard helpers, persistence parsing, share URL encoding, app reducer transitions, rule duplication, rule ordering, undo/redo behavior, generated code formatting, and the Strudel audio engine boundary.
Use `npm run check` as the normal local validation gate; it runs `npm test` and `npm run build`. Use `npm run check:pages` before deployment-related changes; it validates the GitHub Pages build base path. Reducer behavior is covered by unit tests.

## Architecture

### Main Files

- `src/App.tsx`: React state, navigation, rule creation, generated code output, transport calls, and pad preview UI.
- `src/audio/strudelEngine.ts`: small boundary around `@strudel/web` init/evaluate/hush.
- `src/components/RuleDetailPanel.tsx`: compact selected-rule learning panel.
- `src/App.css`: visual layout, dark theme, colorful pads, responsive behavior.
- `vite.config.ts`: Vite React config; GitHub Pages uses the `build:pages` script for the `/StruJam8/` base path.
- `.github/workflows/ci.yml`: GitHub Actions workflow running `npm run check`.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `CONTRIBUTING.md`: contributor setup, validation, PR checklist, and scope guidance.
- `docs/demo.md`: screenshot and demo GIF capture plan for release assets.
- `docs/deployment.md`: GitHub Pages deployment runbook and post-deploy QA checklist.
- `docs/license-review.md`: AGPL license decision notes and upstream Strudel license check.
- `docs/technique-design.md`: technique design principles, route priority, and route expansion rules.
- `LICENSE`: GNU Affero General Public License version 3 text.
- `src/types.ts`: shared data contracts.
- `src/data/pads.ts`: target and intent pad definitions plus route-specific technique pad lookup.
- `src/data/padColors.ts`: shared live pad palette, text color, and minimum contrast target.
- `src/data/presets.ts`: static preset metadata, base code, and preset track patterns.
- `src/data/projectLinks.ts`: source and license links shown in the app header.
- `src/data/routes.ts`: explicit concrete target/intent route definitions and route lookup helpers.
- `src/data/tracks.ts`: track metadata and starter pattern templates for all eight targets.
- `src/data/techniques.ts`: technique definitions with descriptions, Strudel-like snippets, and plain-language snippet explanations.
- `src/lib/accessibilityLabels.ts`: pure labels for rule actions and transport controls.
- `src/lib/announcements.ts`: pure screen reader announcement formatting helpers.
- `src/lib/clipboard.ts`: clipboard copy helpers with success/failure states.
- `src/lib/colorContrast.ts`: pure WCAG-style contrast helpers used by pad palette tests.
- `src/lib/codegen.ts`: pure formatting helpers for audible Strudel code and conservative runtime playback code.
- `src/lib/codeHighlight.ts`: pure helpers for active code line highlighting.
- `src/lib/keyboard.ts`: pure keyboard shortcut helpers and editing-control guards.
- `src/lib/persistence.ts`: localStorage and JSON snapshot parse/serialize helpers.
- `src/lib/shareUrl.ts`: URL snapshot sharing helpers using the `jam` query parameter.
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

The Play button initializes Strudel from a user click and evaluates conservative playable code. Stop calls `hush()` through the audio boundary. While `isPlaying` is true, `App.tsx` re-evaluates the current audible code when it changes. Preset changes and JSON imports stop playback before swapping state. The `isPlaying` state reflects the UI transport status, not a full low-level audio graph status.

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
- `needsTodo?`

Use `needsTodo: true` when a snippet is plausible but not verified against real Strudel behavior.
The code panel displays a TODO comment for those snippets, and the pad preview displays `snippetExplanation` beside the snippet.

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
- Rule list display.
- Rule deletion, duplication, ON/OFF toggling, reordering, undo, and redo for rule changes.
- Intent-level route guide plus technique preview and compact rule detail panels with descriptions, snippets, plain-language snippet explanations, short labels, and TODO badges.
- Drum dance, drum build, keyboard chill, strings widen, bells random, guitar forward, and voice forward routes expand concrete musical coverage while keeping at least one concrete route for every target family.
- Concrete route definitions are centralized in `src/data/routes.ts`.
- Track templates exist for all eight target tracks and avoid sample/soundfont names by default.
- Enabled safe rules are grouped by track and chained against track templates in the audible code panel.
- Toy House and Neon Dub preset selection with synth-safe preset-specific base code.
- Local browser persistence restores rules and selected preset on reload.
- Jam snapshots can be exported and imported as validated JSON files.
- Small jams can be shared through a copied URL containing a validated `jam` parameter.
- Track-composed audible Strudel output for implemented techniques.
- First Strudel audio preview through Play/Stop using `@strudel/web`.
- Conservative playback code generation starts from the preset playback tracks and skips disabled rules, missing snippets, and snippets marked `needsTodo`.
- The right code panel, copied code, and Play input all use the same audible code string.
- Active playback re-evaluates when the audible code string changes, keeping sound and displayed code closer during live edits.
- Active code line highlighting pulses through audible track lines while playing.
- Audible code can be copied to the clipboard from the code panel.
- Fallback technique pads for undefined target/intent combinations.
- Basic responsive layout for desktop, tablet, and narrow screens.
- Number-key shortcuts for live pads 1-8, with tested guards for editable controls and modified key events.
- Visible focus states for keyboard navigation.
- Screen reader status announcements for rule changes.
- Rule action buttons include full-route accessible labels, and Play/Stop labels describe the Strudel audio preview.
- Live pad text color contrast is guarded by tests against the shared target, intent, and technique palette.
- Visible Source and License links in the app header for release readiness.

### Partially Implemented

- Play/Stop: first audio preview only; it initializes Strudel, evaluates the same audible code shown in the right panel, and re-evaluates on audible code changes while playing. It is still not full strudel.cc transport parity.
- Strudel code generation: selected snippets are grouped by track and chained against track templates. Runtime playback uses a stricter formatter that starts from preset playback tracks and omits disabled, missing, and unverified snippets.
- Active code highlighting: implemented at rendered track-line level, not yet token-level `miniLocations` parity with strudel.cc.
- Technique catalog: 25 real routes have concrete snippets, covering every target and every intent at least once:
  - ドラム -> 踊らせる
  - ドラム -> 盛り上げる
  - ドラム -> 抜く
  - ドラム -> 崩す
  - ドラム -> チル
  - ドラム -> ランダム感
  - ドラム -> 前に出す
  - ベース -> 崩す
  - ベース -> 踊らせる
  - ベース -> 盛り上げる
  - ベース -> 抜く
  - ベース -> チル
  - ベース -> 前に出す
  - コード -> 盛り上げる
  - コード -> チル
  - コード -> 広げる
  - コード -> 抜く
  - コード -> 崩す
  - コード -> 前に出す
  - キーボード -> チル
  - キーボード -> ランダム感
  - ストリングス -> 広げる
  - ベル -> ランダム感
  - ギター -> 前に出す
  - ボイス -> 前に出す
- Learning experience: intent-level route descriptions, technique descriptions, snippets, and plain-language snippet explanations are visible in the pad preview and selected rule detail, but there is no guided mode or full code walkthrough yet.
- Selection feedback: selected technique pads are outlined for active rules, and rules can be duplicated, removed, toggled on/off, reordered, undone, and redone. Parameter-level editing is not implemented yet.
- Target and intent coverage: all eight target families and all eight intent families now have at least one concrete target/intent route.

### Missing

- Token-level active code highlighting using Strudel mini location metadata.
- Audio graph lifecycle beyond basic start/stop: update, dispose, and runtime error recovery.
- External sample-pack and soundfont loading after license review.
- Parameter editing for existing rules.
- User-defined presets and named preset saving.
- Large jam sharing beyond practical URL length limits.
- MIDI/controller input.
- Full browser-rendered UI interaction tests.
- Accessibility pass beyond basic semantic buttons and labels.
- Error handling for invalid snippets or future runtime failures.

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
- Local and CI quality gates run `npm run check`; the GitHub Pages workflow runs `npm run check:pages` for the deployment build.
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

Current level: fine for 200 techniques, 8 track templates, 2 static presets, one local jam snapshot, JSON import/export, and small URL snapshots; fragile for hundreds.

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
- URL sharing is convenient for small jams but can exceed browser URL limits as rule counts grow.

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
- Add guided examples that connect the snippet explanation to the generated code panel.

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
- Add TODO badges for unverified snippets: done in the pad preview, rule list, and rule detail panel; unverified snippets are skipped by Play.
- Add a compact rule detail view: done.

### Phase 3: Expand Musical Coverage

Goal: make the 8-pad system musically useful across all targets.

Tasks:

- Define real techniques for more target/intent routes: first target coverage pass done, then intent coverage pass added ドラム -> 抜く, ベース -> 踊らせる, コード -> チル, and キーボード -> ランダム感. Core expansion then added ドラム -> 崩す, ベース -> 盛り上げる, and コード -> 広げる. Reduction expansion then added ベース -> 抜く, コード -> 抜く, and ドラム -> チル. Core contrast/surprise expansion then added ベース -> チル, コード -> 崩す, and ドラム -> ランダム感. Forward expansion then added ドラム -> 前に出す, ベース -> 前に出す, and コード -> 前に出す. Current catalog has 25 concrete routes and 200 techniques.
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
- Implement update and dispose lifecycle: pending.
- Handle invalid code safely: partial; UI catches start failures, but runtime validation is still shallow.
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
- Add automated checks in GitHub Actions: done for test and build via `npm run check`.
- Add GitHub Pages deployment workflow: done in `.github/workflows/pages.yml`; it runs `npm run check:pages`, and repository Pages settings still need to allow GitHub Actions deployment. Runbook added in `docs/deployment.md`.
- Add screenshots or demo GIF: capture plan added in `docs/demo.md`; actual image/GIF assets still pending.
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
