# StruJam8 License Review

Last reviewed: 2026-07-03

This note records the current licensing decision for StruJam8. It is project documentation, not legal advice.

## Decision

StruJam8 uses `AGPL-3.0-or-later`.

Artifacts updated:

- `LICENSE`: GNU Affero General Public License version 3 text.
- `package.json`: SPDX license expression `AGPL-3.0-or-later`.
- `README.md`: user-facing license section.
- `CONTRIBUTING.md`: contributor-facing license note.

## Upstream Check

The Strudel upstream repository was checked on 2026-07-03:

- https://github.com/tidalcycles/strudel/blob/main/LICENSE

The upstream license file is the GNU Affero General Public License version 3.

## Rationale

StruJam8 does not currently bundle `@strudel/web` or run the Strudel audio engine. The app is still UI-only and generates Strudel-like preview code. However, choosing an AGPL-compatible license now keeps the project aligned with Strudel before external contributions and before future runtime integration.

## Follow-Up

Re-check license compatibility before adding `@strudel/web`, deploying a hosted public service, or accepting large third-party contributions.
