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

## 5. The fishing minigame

`src/lib/minigames/fishing` is a self-contained PixiJS 8 engine, not Svelte UI: it
paints itself.

- Layout: `engine/` with the public API in `engine/index.ts` and `art/`;
  `src/lib/components/FishingGame.svelte` is the Svelte 5 wrapper (lazy engine
  import; canvas rules in its `<style>`); the page is `src/routes/minigames/fishing`,
  and its `.fishing-shell` styles live in the page's `<style>` — the minigame ships
  no global CSS. Architecture, gameplay rules, host wiring and asset credits live in
  [`docs/fishing/`](docs/fishing/README.md).
- The game draws in a fixed 480×270 virtual frame: layout numbers are those units,
  not CSS pixels.
- Area ids `cove` / `deep` / `rapids` are saved-progress keys — never rename them.
- Art, fonts and sounds come from the CDN (`FISHING_ASSETS_CDN` in
  `src/lib/constants.ts`); only the Vite-bundled `art/` is committed.
- Dev panels are tune-only: `F2` audio, `F3` sky and water, `F8` fight zones. They
  write to the running game and are lost on reload; tuned numbers are copied into
  `audioMix.ts` / `zoneTuning.ts` by hand.
