# StruJam8 Release Readiness

This document is the working release checklist for the public MVP. It records
what is verified, what is intentionally limited, and what should be built
next. Update the checkpoint and evidence links when a release changes.

## Current Checkpoint

- Date: 2026-09-10
- Application checkpoint commit: `a80c0f6`
- Public URL: https://toyo1621.github.io/StruJam8/
- Repository: https://github.com/toyo1621/StruJam8
- Repository visibility: public
- Pages deployment: GitHub Actions workflow succeeded for the checkpoint commit (`34486774332`)
- Public HTTP smoke: `200 OK`
- Local working commit pushed: `a80c0f6`
- Production dependency audit: `npm audit --omit=dev --audit-level=high` reported 0 vulnerabilities

## Functional Requirements

| Requirement | Status | Evidence or limit |
| --- | --- | --- |
| Select target, intent, and technique with eight pads | Done | Playwright covers the three-level flow and all 37 concrete routes; route data tests cover the catalog. |
| Add a technique to the rule list | Done | React integration and browser tests cover rule creation. |
| Show readable generated Strudel-like code | Done | `src/lib/codegen.ts` is tested for track grouping, comments, and snippets. |
| Keep the visible code and Play input identical | Done | Both use the same `audibleCode` value. |
| Update the running preview after a rule change | Done | Browser test covers adding a technique while audio is playing. |
| Select a static preset, including the original Indietronica palette | Done | Toy House, Neon Dub, and Indietronica are defined in `src/data/presets.ts`; Chromium covers selecting and playing Indietronica. |
| Evaluate every catalog technique snippet | Done for installed runtime | `npm run verify:techniques` evaluated all 296 catalog snippets in a real Chromium page against the installed Strudel runtime. `npm run verify:highlighting` confirms `miniLocations` for 296/296 techniques and observes runtime event locations for 295/296 in a 500ms window; the remaining rest-oriented technique may be silent during that window. |
| Highlight the code currently producing sound | Partial | Runtime Hap locations are merged and highlighted at token level; evaluator `miniLocations` are forwarded to refine the active source leaves; the left rule list also marks the producing rule `LIVE`, with a target-level fallback for broad locations; selecting a rule scrolls its generated code chain into view. Representative all-eight-target coverage, one verified playback technique per concrete route, 28 additional runtime-verified techniques, and 295/296 event-location observation are covered. Exact strudel.cc editor rendering/state parity and event-window coverage for intentional silence remain incomplete. |
| Stop and retry after runtime failure | Done for MVP | Invalid snippet and failed runtime-load recovery are covered in Chromium. This is not full strudel.cc transport parity. |
| Persist and share a small jam | Done | LocalStorage, JSON export/import, and URL snapshot helpers are tested. URLs above the practical limit are blocked with an Export JSON fallback. |
| Support all eight target families and intent families | Partial | Concrete routes cover every family, but not all 64 target/intent combinations. Undefined combinations intentionally show fallback techniques. |
| Load external samples or soundfonts | Deferred | Built-in synth/noise sounds are used until asset provenance and license compatibility are reviewed. |

## Non-Functional Requirements

| Requirement | Status | Evidence or limit |
| --- | --- | --- |
| TypeScript and production build are clean | Done | `npm run check` and `npm run check:pages` pass. |
| GitHub Pages base path works | Done | Pages preview tests pass and the deployed URL returns `200 OK`. |
| Regression coverage | Done for MVP | 22 Vitest files, 171 unit/component tests, and 20 Chromium tests pass in root preview. Pages-base-path verification also passes 20 Chromium tests for the production-shaped build. |
| Mobile and tablet usability | Done for tested sizes | 360px and 1024px overflow/touch-target checks pass. Real iPad and Safari testing remains. |
| Keyboard and screen-reader basics | Partial | Semantic groups, labels, focus states, announcements, and guarded number keys exist. A full assistive-technology audit remains. |
| Reduced-motion support | Done | The reduced-motion browser test verifies transitions are disabled. |
| Performance | Partial | Strudel is lazy-loaded as one runtime chunk of about 710 kB minified (about 226 kB gzip); the source-entry build shares one `@strudel/core` copy and avoids the duplicate-core warning. Retry uses a query-keyed URL to bypass a failed module cache. The initial UI chunk is about 302 kB minified, so this budget remains under review. |
| Runtime resilience | Done for MVP | Retry, normal-stop AudioContext suspension, fresh-context recovery when needed, stale evaluation cancellation, Superdough controller/effect reset, and error boundaries are covered by unit tests and Chromium E2E. Full normal-stop context closure, strudel.cc transport parity, and error-specific recovery remain outside the MVP. |
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
- The public URL returns `200 OK` and shows the latest build.
- Play starts only after a user gesture, Stop hushes and suspends the preview context, the next Play resumes it, and Retry is available after a deliberate failure.
- The 360px layout has no horizontal overflow and primary controls remain at least 44px high.
- Source and license links point to the expected public pages.

## Development Order

### 1. Finish playback correctness

1. Verify the highest-use safe snippets against the installed Strudel version.
2. Keep unverified snippets marked with `needsTodo` and excluded from Play.
3. Maintain route reachability coverage and run both `npm run verify:techniques` and `npm run verify:highlighting`; the current measured baseline is 296/296 `miniLocations` and 295/296 event-location observation in a 500ms window.
4. Test Safari/iPad audio start, stop, context suspension, and retry on real hardware.

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

## Beginner Note

The important boundary is `audibleCode`: it is the single string sent to
Strudel, shown in the code panel, and copied to the clipboard. Keeping those
three paths identical prevents a common beginner bug where the screen shows one
thing but the browser evaluates another. The next major boundary is runtime
event location data: it tells the UI which source range is making sound, while
the fallback pulse keeps the interface understandable when that metadata is
missing.
