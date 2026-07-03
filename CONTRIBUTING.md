# Contributing to StruJam8

Thanks for helping improve StruJam8. This project is currently an MVP focused on UI, state management, and a readable Strudel-like code preview. Audio playback is not implemented yet.

## Project Scope

StruJam8 should preserve its core 8-pad flow:

1. Choose a target sound.
2. Choose an intention.
3. Choose a technique.
4. Add a rule.
5. Show readable Strudel-like code.

Before adding large new systems, prefer data-driven improvements in `src/data/` and small isolated helpers in `src/lib/`.

## Setup

```bash
npm install
npm run dev
```

## Validation

Run the full local quality gate before opening a PR:

```bash
npm run check
```

`npm run check` runs both:

```bash
npm test
npm run build
```

GitHub Actions runs the same check on pushes to `main` and pull requests.

## Development Guidelines

- Keep the UI usable without audio playback.
- Keep generated Strudel-like code readable, even when snippets are only previews.
- Add concrete target/intent routes in `src/data/routes.ts` before adding route-specific techniques.
- Keep every concrete route at exactly eight techniques.
- Mark unverified Strudel snippets with `needsTodo: true`.
- Prefer stable IDs over display labels for state, persistence, and routing.
- Keep parsing, persistence, clipboard, and sharing logic out of React components when practical.
- Do not add Blockly or `@strudel/web` unless that phase is explicitly requested.

## Tests

Add or update focused tests when changing:

- Technique or route data.
- Preset, track, persistence, sharing, clipboard, or code generation helpers.
- Reducer behavior such as rules, undo, import, reset, or preset selection.

For UI-only styling changes, run `npm run check` and manually inspect the app in the browser when possible.

## Pull Request Checklist

- The change preserves the 8-pad target -> intent -> technique model.
- New data has stable IDs and focused tests where appropriate.
- `npm run check` passes locally.
- README.md or AI_README.md is updated when behavior, commands, architecture, or requirements change.
- No unrelated generated files or local-only artifacts are included.

## License Note

StruJam8 is licensed under `AGPL-3.0-or-later`. By contributing, you agree that your contribution may be distributed under that license. See `LICENSE` and `docs/license-review.md` for the current project decision. Re-check compatibility before adding Strudel runtime packages or large third-party code.
