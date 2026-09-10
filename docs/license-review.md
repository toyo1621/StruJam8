# StruJam8 License Review

Last reviewed: 2026-09-10

This note records the current licensing decision for StruJam8. It is project documentation, not legal advice.

## Decision

StruJam8 uses `AGPL-3.0-or-later`.

Artifacts updated:

- `LICENSE`: GNU Affero General Public License version 3 text.
- `package.json`: SPDX license expression `AGPL-3.0-or-later`.
- `README.md`: user-facing license section.
- `CONTRIBUTING.md`: contributor-facing license note.

## Upstream Check

The Strudel package metadata was checked on 2026-07-04 with npm metadata for `@strudel/web@1.3.0`.

Observed package metadata:

- `@strudel/web`: `AGPL-3.0-or-later`
- `@strudel/core`: `AGPL-3.0-or-later`
- `@strudel/webaudio`: `AGPL-3.0-or-later`
- `@strudel/transpiler`: `AGPL-3.0-or-later`

Development-only tooling currently reports permissive licenses: Playwright is Apache-2.0, while React, Vite, Vitest, Testing Library, and jsdom are MIT. These packages are used for build/test workflows and are not runtime audio assets.

The GitHub mirror at https://github.com/tidalcycles/strudel also indicates that the project moved to Codeberg and shows AGPL-3.0 licensing on the mirror.

## Rationale

StruJam8 now bundles `@strudel/web` for a first browser audio preview. Keeping StruJam8 under an AGPL-compatible license remains aligned with the observed Strudel package licenses.

Default presets use built-in synth/noise sounds registered by the installed Strudel audio stack. The app does not load external Strudel sample packs by default in this playback phase. External sample packs, soundfonts, hosted audio assets, and third-party contributions still need separate review before they are enabled or redistributed.

## Indietronica Preset Provenance

The `Indietronica` preset is an original Strudel code composition that uses
only the existing built-in synth/noise vocabulary. Its description names
alt-J's "Tessellate" as a broad creative reference for clicking rhythms and
atmospheric contrast, but the repository does not include the song's
recording, samples, lyrics, transcription, or a deliberate reproduction of
its melody. This is a provenance record, not a legal conclusion; review any
future public marketing language or closer musical adaptation separately.

## Follow-Up

Re-check license compatibility before loading external sample packs, changing Strudel runtime packages, deploying a hosted public service, or accepting large third-party contributions.
