# StruJam8 Technique Design

This document records how StruJam8 thinks about technique pads. It is the design guide for adding new `target -> intent -> technique` routes.

## Goal

A technique should feel like a musical action, not just a Strudel method name. Users should be able to press a pad and understand the intention in plain language. The Strudel snippet is the implementation detail behind that action.

Good technique labels answer: what happens to the music?

Examples:

- Good: `音数を抜く`, `裏拍を足す`, `音を丸くする`
- Too raw: `degradeBy`, `off`, `lpf`

## Design Axes

Each eight-pad route should usually cover a balanced mix of these axes:

- Density: add or remove notes, make a part busy or sparse.
- Timing: shift, slow, double, or add shadow layers.
- Pitch: octave jumps, high/low replies, brighter interval additions.
- Tone: filters, distortion, brightness, softness.
- Space: room, delay-like offset, distance.
- Dynamics: gain and foreground/background placement.
- Variation: sometimes, reverse, small fills, random-feeling changes.
- Safety: whether the snippet is known to work in current playback.

A route does not need every axis, but it should avoid eight versions of the same idea.

## Playback Safety

StruJam8 currently uses conservative browser playback through `@strudel/web`. A technique can be shown in the UI even when the snippet is not ready for Play, but then it must be marked with `needsTodo: true`.

Rules for snippets:

- Prefer simple, already-used operators first: `gain`, `lpf`, `hpf`, `room`, `slow`, `fast`, `rev`, `degradeBy`, `off`, `sometimes`, `add(note(...))`, `distort`, `legato`, `release`.
- If a snippet is musically useful but not confirmed in the current runtime, keep it visible but set `needsTodo: true`.
- The audible code generator skips disabled rules, missing snippets, and `needsTodo` snippets.
- The UI should explain skipped snippets so users do not think Play is broken.

## Current Concrete Route Coverage

Current coverage is intentionally broader than the original MVP, but still not the full 64-route matrix.

Implemented concrete routes:

- ドラム -> 踊らせる
- ドラム -> 盛り上げる
- ドラム -> 抜く
- ベース -> 崩す
- ベース -> 踊らせる
- コード -> 盛り上げる
- コード -> チル
- キーボード -> チル
- キーボード -> ランダム感
- ストリングス -> 広げる
- ベル -> ランダム感
- ギター -> 前に出す
- ボイス -> 前に出す

This gives every target at least one concrete route and every intent at least one concrete route.

## Route Priority

When adding routes, prefer combinations that improve live performance first:

1. Core groove: drums, bass, chords.
2. Contrast controls: build, remove, chill, break.
3. Movement and surprise: dance, random, widen, forward.
4. Decorative targets: bells, strings, guitar, voice.

Avoid filling the full matrix with generic placeholders. A route should become concrete only when its eight techniques are musically distinct and explainable.

## Adding a Route

1. Add the route in `src/data/routes.ts`.
2. Add exactly eight technique definitions in `src/data/techniques.ts`.
3. Use stable IDs: `target-intent-action`.
4. Write user-facing labels first, snippets second.
5. Add or update tests in `src/data/techniques.test.ts`.
6. Update README / AI_README route counts when coverage changes.

## Beginner Note

Think of a technique as a small recipe. The label is what the musician wants, the description is why it helps, and the snippet is how Strudel tries to do it. Keeping those three separate makes the UI easier to understand and the code easier to maintain.
