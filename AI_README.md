# StruJam8 AI README

This document is for AI agents and developers continuing work on StruJam8.
Use this alongside README.md. README.md is product-facing; this file is implementation-facing.

## Project Summary

StruJam8 is an MVP for an open-source visual jam interface for Strudel.
The current priority is UI, state management, and code-generation experience.
The app does not play sound yet.

Primary user flow:

1. Select a target sound.
2. Select an intention.
3. Select a technique.
4. Add a rule.
5. Show a Strudel-like code snippet in the right code panel.

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

A small Vitest suite covers route lookup, technique lookup, concrete route completeness, concrete route uniqueness, all-target route coverage, required learning copy, project source/license link metadata, accessibility labels, live pad color contrast, keyboard shortcut mapping and interaction guards, screen reader announcement formatting, clipboard helpers, persistence parsing, share URL encoding, app reducer transitions, rule duplication, rule ordering, undo/redo behavior, and generated code formatting.
Use `npm run check` as the normal local validation gate; it runs `npm test` and `npm run build`. Use `npm run check:pages` before deployment-related changes; it validates the GitHub Pages build base path. Reducer behavior is covered by unit tests.

## Architecture

### Main Files

- `src/App.tsx`: React state, navigation, rule creation, generated code output, and pad preview UI.
- `src/components/RuleDetailPanel.tsx`: compact selected-rule learning panel.
- `src/App.css`: visual layout, dark theme, colorful pads, responsive behavior.
- `vite.config.ts`: Vite React config; GitHub Pages uses the `build:pages` script for the `/StruJam8/` base path.
- `.github/workflows/ci.yml`: GitHub Actions workflow running `npm run check`.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.
- `CONTRIBUTING.md`: contributor setup, validation, PR checklist, and scope guidance.
- `docs/demo.md`: screenshot and demo GIF capture plan for release assets.
- `docs/deployment.md`: GitHub Pages deployment runbook and post-deploy QA checklist.
- `docs/license-review.md`: AGPL license decision notes and upstream Strudel license check.
- `LICENSE`: GNU Affero General Public License version 3 text.
- `src/types.ts`: shared data contracts.
- `src/data/pads.ts`: target and intent pad definitions plus route-specific technique pad lookup.
- `src/data/padColors.ts`: shared live pad palette, text color, and minimum contrast target.
- `src/data/presets.ts`: static preset metadata, base code, and preset track patterns.
- `src/data/projectLinks.ts`: source and license links shown in the app header.
- `src/data/routes.ts`: explicit concrete target/intent route definitions and route lookup helpers.
- `src/data/tracks.ts`: track metadata and starter pattern templates for all eight targets.
- `src/data/techniques.ts`: technique definitions with descriptions, Strudel-like snippets, and plain-language snippet explanations.
- `src/lib/accessibilityLabels.ts`: pure labels for rule actions and UI-only transport controls.
- `src/lib/announcements.ts`: pure screen reader announcement formatting helpers.
- `src/lib/clipboard.ts`: clipboard copy helpers with success/failure states.
- `src/lib/colorContrast.ts`: pure WCAG-style contrast helpers used by pad palette tests.
- `src/lib/codegen.ts`: pure formatting helpers for generated Strudel-like code.
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

The Play and Stop buttons only toggle UI state. They do not control audio.

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
- Track templates exist for all eight target tracks.
- Enabled rules are grouped by track and chained against track templates in generated code preview.
- Toy House and Neon Dub preset selection with preset-specific base code.
- Local browser persistence restores rules and selected preset on reload.
- Jam snapshots can be exported and imported as validated JSON files.
- Small jams can be shared through a copied URL containing a validated `jam` parameter.
- Track-composed Strudel-like preview output for implemented techniques.
- Generated code can be copied to the clipboard from the code panel.
- Fallback technique pads for undefined target/intent combinations.
- Basic responsive layout for desktop, tablet, and narrow screens.
- Number-key shortcuts for live pads 1-8, with tested guards for editable controls and modified key events.
- Visible focus states for keyboard navigation.
- Screen reader status announcements for rule changes.
- Rule action buttons include full-route accessible labels, and Play/Stop labels clarify the v0 audio limitation.
- Live pad text color contrast is guarded by tests against the shared target, intent, and technique palette.
- Visible Source and License links in the app header for release readiness.

### Partially Implemented

- Play/Stop: visual toggle only; no audio engine.
- Strudel code generation: selected snippets are grouped by track and chained against track templates, but the result is still a preview and is not validated against a live Strudel runtime.
- Technique catalog: nine real routes have concrete snippets:
  - ベース -> 崩す
  - コード -> 盛り上げる
  - ドラム -> 踊らせる
  - ドラム -> 盛り上げる
  - キーボード -> チル
  - ストリングス -> 広げる
  - ベル -> ランダム感
  - ギター -> 前に出す
  - ボイス -> 前に出す
- Learning experience: intent-level route descriptions, technique descriptions, snippets, and plain-language snippet explanations are visible in the pad preview and selected rule detail, but there is no guided mode or full code walkthrough yet.
- Selection feedback: selected technique pads are outlined for active rules, and rules can be duplicated, removed, toggled on/off, reordered, undone, and redone. Parameter-level editing is not implemented yet.
- Target coverage: all eight target families now have at least one concrete target/intent route.

### Missing

- Real Strudel runtime integration.
- Audio graph lifecycle: start, stop, update, dispose.
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

Current level: fine for 72 techniques, 8 track templates, 2 static presets, one local jam snapshot, JSON import/export, and small URL snapshots; fragile for hundreds.

Strengths:

- Duplicate technique IDs, route uniqueness, concrete route completeness, and all-target route coverage are covered by tests.
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

Current level: acceptable for UI-only MVP.

Risks:

- Rule IDs use `crypto.randomUUID()` with a `Date.now()` fallback.
- Strudel snippets are strings and not validated.
- RESET semantics are tested and announced, but users may still expect it to return home because the visible label is intentionally compact.
- localStorage access is guarded and malformed snapshots are ignored.

Recommended direction:

- Consider deterministic IDs only if future persistence requires predictable references.
- Add snippet validation once Strudel runtime or parser is introduced.
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
- Play/Stop controls expose that they are UI-only in v0.
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
- Keep audio update boundaries explicit when Strudel runtime is added.

### Legal / Licensing

Current level: selected for MVP.

Strengths:

- `LICENSE` is present with GNU AGPL version 3 text.
- `package.json` uses the SPDX expression `AGPL-3.0-or-later`.
- `docs/license-review.md` records the 2026-07-03 upstream Strudel license check and rationale.
- The app header exposes Source and License links through `src/data/projectLinks.ts`.
- Attribution is clear: this is not an official Strudel project.

Risks:

- This is a project decision, not legal advice.
- License compatibility should be re-checked before adding `@strudel/web`, deploying a hosted public service, or accepting large third-party contributions.

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
- Add TODO badges for unverified snippets: done in the pad preview.
- Add a compact rule detail view: done.

### Phase 3: Expand Musical Coverage

Goal: make the 8-pad system musically useful across all targets.

Tasks:

- Define real techniques for more target/intent routes: first target coverage pass done; ドラム -> 踊らせる, ドラム -> 盛り上げる, キーボード -> チル, ストリングス -> 広げる, ベル -> ランダム感, ギター -> 前に出す, and ボイス -> 前に出す added.
- Create track templates for drums, bass, chords, keys, strings, bells, guitar, and voice: done.
- Decide how multiple snippets compose for the same track: done for preview output with ordered per-track chaining.
- Add presets beyond Toy House: done with a second static preset, Neon Dub.

### Phase 4: Strudel Runtime Integration

Goal: make Play/Stop real.

Do not add `@strudel/web` until this phase is explicitly requested.

Tasks:

- Research the current official Strudel web/runtime integration path.
- Add an audio engine boundary module instead of calling Strudel directly from UI components.
- Implement start, stop, update, and dispose lifecycle.
- Handle invalid code safely.
- Add a user gesture gate for browser audio permissions.

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
- Do not add `@strudel/web` or audio playback unless explicitly requested.
- Keep generated code readable even before it becomes executable.
- Run `npm run check` before reporting completion when practical; at minimum run `npm test` and `npm run build`.
- If touching GitHub, check `git status -sb` first and avoid staging unrelated changes.
