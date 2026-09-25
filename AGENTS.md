# Agent conventions (aukus-svelte)

General requirements. The examples cite current patterns — follow the
principle behind them, not just the listed cases.

## 1. Reuse shared infrastructure — never reimplement it in components

- Before adding local state, helpers, or browser APIs for a cross-cutting
  concern (audio, data lookups, formatting, timers), check `src/lib/stores`,
  `src/lib/utils`, and `src/lib/constants`. Extend the existing module;
  do not duplicate the logic per component (e.g. UI sounds live in
  `SoundManager`, not as `new Audio()` in each button).
- Components consume stores; they do not own shared behavior.
- New shared values (sound keys, asset URLs, shared constants) go next to
  the existing ones in `constants.ts`; initialization/preloading stays with
  the owning store (wired in `AppManager`), not in components.
- Respect each store's contract from the component side: use the method
  meant for your use case (e.g. UI blips vs. music loops have different
  mute/volume semantics) — do not bypass or change the semantics locally.

## 2. Style through the theme — never hardcode design values

- No literal colors, font names, or other design values in component
  classes. Use the tokens and utilities defined in `src/app.css`.
- New design values are added as theme tokens (raw value plus a mapping
  following the existing pattern), not inline at usage sites.
- A class combination repeated in several places becomes a named `@utility`;
  one-off sizing/positioning stays inline.
- Global base styles cover the common case; components add style classes
  only to deviate from it.

## 3. Keep components presentational and explicit

- Props are the interface. Required data comes in via props; anything
  optional must be truly optional — the component renders sensibly without
  it (e.g. hides the section) instead of silently resolving app state
  itself via store lookups.
- Callers that have context pass it; callers that don't get the reduced UI.
  Do not push data resolution down into presentational components.

## 4. Verification

- `npm run check` must report 0 errors, 0 warnings.
- After theme/CSS changes, run `npm run build` and confirm the new classes
  are present in the compiled client CSS.
