# StruJam8 Release Readiness

This document is the working release checklist for the public MVP. It records
what is verified, what is intentionally limited, and what should be built
next. Update the checkpoint and evidence links when a release changes.

## Current Checkpoint

- Date: 2026-10-03 (JST)
- Scope: P1 hardening after the audit of baseline `18ee456`; the release commit is recorded in the deployed `release.json`.
- Public URL: https://toyo1621.github.io/StruJam8/
- Repository: https://github.com/toyo1621/StruJam8
- Repository visibility: public
- Local evidence: 200 unit/component tests, TypeScript/root build, 27 root Chromium tests and 27 Pages-build Chromium tests passed.
- Catalog evidence: 296/296 snippets evaluate; 296/296 have miniLocations, 295/296 produce event locations in the 500ms observation window.
- Publication is a separate check: verify the Pages workflow SHA, `release.json`, asset hashes and a browser smoke flow. Local green tests alone do not establish production parity.
- Production dependency audit: `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities

## Functional Requirements

| Requirement | Status | Evidence or limit |
| --- | --- | --- |
| Select target, intent, and technique with eight pads | Done | Playwright covers the three-level flow and all 37 concrete routes; route data tests cover the catalog. |
| Add a technique to the rule list | Done | React integration and browser tests cover rule creation. |
| Show readable generated Strudel-like code | Done | `src/lib/codegen.ts` is tested for track grouping, comments, and snippets. |
| Keep the visible code and Play input identical | Done for tested paths | Hidden fallback arrangements were removed. Display, Copy and engine input are compared exactly for all three presets; failures stop with Retry instead of evaluating different music. |
| Update the running preview after a rule change | Done | Browser test covers adding a technique while audio is playing. |
| Select a static preset, including the original Indietronica palette | Done | Toy House, Neon Dub, and Indietronica are defined in `src/data/presets.ts`; Chromium covers selecting and playing Indietronica. |
| Evaluate every catalog technique snippet | Done for installed runtime | `npm run verify:techniques` evaluated all 296 catalog snippets in a real Chromium page against the installed Strudel runtime. `npm run verify:highlighting` confirms `miniLocations` for 296/296 techniques and observes runtime event locations for 295/296 in a 500ms window; the remaining rest-oriented technique may be silent during that window. |
| Highlight the code currently producing sound | Partial | Runtime Hap locations are merged and highlighted at token level; evaluator `miniLocations` are forwarded to refine the active source leaves; the left rule list also marks the producing rule `LIVE`, with a target-level fallback for broad locations; selecting a rule scrolls its generated code chain into view. Representative all-eight-target coverage, one verified playback technique per concrete route, 28 additional runtime-verified techniques, and 295/296 event-location observation are covered. Exact strudel.cc editor rendering/state parity and event-window coverage for intentional silence remain incomplete. |
| Stop and retry after runtime failure | Partial | Engine/hook tests cover failed evaluation, live-update failure, stale callbacks, unmount and Stop during initialization/update. Chromium covers pending initialization cancellation, normal context suspension and runtime-load Retry. Safari/iPad and long-session stress remain unverified. |
| Persist and share a small jam | Done for tested paths | LocalStorage, JSON export/import, and URL helpers share canonical restoration. Successful local save consumes the shared URL so RESET survives reload. Failed storage shows an unsaved notice; failed import preserves the current jam. |
| Support all eight target families and intent families | Partial | Concrete routes cover every family, but not all 64 target/intent combinations. Undefined combinations intentionally show fallback techniques. |
| Load external samples or soundfonts | Deferred | Built-in synth/noise sounds are used until asset provenance and license compatibility are reviewed. |

## Non-Functional Requirements

| Requirement | Status | Evidence or limit |
| --- | --- | --- |
| TypeScript and production build are clean | Done | `npm run check` and `npm run check:pages` pass. |
| GitHub Pages base path works | Done | Pages preview tests pass and the deployed URL returns `200 OK`. |
| Regression coverage | Partial | 24 Vitest files / 200 tests and 27 Chromium tests pass at both root and Pages base paths. Real listening, assistive-technology and Safari checks remain evidence gaps. |
| Untrusted snapshot execution | Hardened | URL, JSON and localStorage cannot supply executable snippets or labels: IDs are restored through the catalog. Unknown/mismatched techniques, duplicate IDs and invalid snapshots are rejected atomically. Parser tests plus three real-browser injection regression cases cover the trust boundary. |
| Bounded inputs and storage failure | Hardened | Shared constants cap snapshots at 256 KiB and rules at 128; parser, file import and reducer enforce limits. This is a resource bound, not a musical-complexity or audio-safety guarantee. |
| Deployment gate and identity | Implemented; verify per release | Pages calls reusable CI; tests, builds, dependency audit, both browser suites and catalog checks must pass before upload. No rebuild follows validation. Only deployment receives write permissions. `release.json` exposes commit and file hashes. |
| Mobile and tablet usability | Done for tested sizes | 360px has no horizontal overflow and 44px controls. At 1024x768 the two work panels and all eight pads are visible without scrolling. Real iPad and Safari testing remains. |
| Keyboard and screen-reader basics | Partial | Semantic groups, labels, announcements and guarded number keys exist. Enter and number-key level changes move focus to the first newly rendered pad. A real assistive-technology audit remains. |
| Visual contrast | Done for tested code/pad palettes | Every live-pad combination and every syntax-token color is tested at 4.5:1 or better. Runtime highlight combinations and real-device rendering still need human review. |
| Reduced-motion support | Done | The reduced-motion browser test verifies transitions are disabled. |
| Performance | Partial | Strudel is lazy-loaded as one runtime chunk of about 710 kB minified (about 226 kB gzip); the source-entry build shares one `@strudel/core` copy and avoids the duplicate-core warning. Retry uses a query-keyed URL to bypass a failed module cache. The initial UI chunk is about 302 kB minified, so this budget remains under review. |
| Runtime resilience | Partial | Playback lifecycle is isolated in `useAudioPlayback`; generation checks reject late results. Stop during delayed initialization is guarded in both hook and engine. Full strudel.cc transport parity and browser/device coverage remain outside this checkpoint. |
| License and provenance | Partial | The app is AGPL-3.0-or-later and the current runtime review is documented. Re-check before adding samples, fonts, or hosted services. |

## Release Gate

Run these commands sequentially before merging a release:

```bash
npm run check
npm run check:pages
npm run test:e2e
npm run test:e2e:pages
npm run verify:techniques
npm run verify:highlighting
npm audit --omit=dev --audit-level=high
```

Then verify:

- `git status --short --branch` is clean and `origin/main` matches the release commit.
- The Pages workflow is green for the same commit.
- The public URL returns `200 OK`; `release.json` matches the intended commit and its file hashes match the served files.
- Play starts only after a user gesture, Stop hushes and suspends the preview context, the next Play resumes it, and Retry is available after a deliberate failure.
- The 360px layout has no horizontal overflow and primary controls remain at least 44px high.
- Source and license links point to the expected public pages.

## Development Order

### 1. Finish playback correctness

1. Verify the highest-use safe snippets against the installed Strudel version.
2. Keep unverified snippets marked with `needsTodo` and excluded from Play.
3. Maintain route reachability coverage and run both `npm run verify:techniques` and `npm run verify:highlighting`; the current measured baseline is 296/296 `miniLocations` and 295/296 event-location observation in a 500ms window.
4. Test Safari/iPad audio start, stop, context suspension, and retry on real hardware.

Do not reintroduce silent compatibility fallback code. Keep failures visible and retry the
same displayed code. `useAudioPlayback` owns lifecycle state; the rule reducer must not
hold a second, competing `isPlaying` value.

### 2. Finish code highlighting parity

1. Compare Strudel Hap locations with rendered token ranges for each track type.
2. Add a small fixture for every codegen route, including simultaneous events.
3. Keep the evaluator `miniLocations` bridge as the current runtime contract, while tracking exact strudel.cc editor metadata/state parity as a later compatibility task.
4. Preserve a fallback visual pulse when runtime location metadata is unavailable.

### 3. Improve the learning loop

1. Add parameter controls only after the current rule model remains readable.
2. Explain one generated method at a time instead of hiding the chain behind automation.
3. Add named jam recipes and a safe beginner mode before exposing arbitrary code editing.

### 4. Expand the audio palette carefully

1. Review Strudel and every asset's license and redistribution terms.
2. Add one documented asset family at a time with provenance metadata.
3. Keep a built-in-sound fallback so the UI and tests remain usable offline.

### 5. Prepare a stronger public release

1. Add real-device accessibility and audio QA.
2. Measure first interaction and Play-to-first-sound latency on a cold Pages load.
3. Reduce or justify large runtime chunks before adding more dependencies.
4. Capture an updated desktop, tablet, and short interaction demo without private browser state.

## Remaining Audit Findings

- P2 / M: split remaining rule/code rendering out of the large App component when changing those views; avoid a framework rewrite.
- P2 / M: measure real Safari/iPad playback, cold-start latency and long-running stability. These are evidence gaps, not proven failures.
- P3 / S: pin third-party Actions to reviewed immutable SHAs as a separate supply-chain maintenance change.

No database, authentication service or remote telemetry is required for this browser-only MVP.

## Beginner Note

The important boundary is `audibleCode`: it is the single string sent to
Strudel, shown in the code panel, and copied to the clipboard. Keeping those
three paths identical prevents a common beginner bug where the screen shows one
thing but the browser evaluates another. The next major boundary is runtime
event location data: it tells the UI which source range is making sound, while
the fallback pulse keeps the interface understandable when that metadata is
missing.
