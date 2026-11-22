# Credits

Ассеты лежат на CDN и в репозиторий не входят; ниже — их авторы, лицензии и то,
из чего они собраны. Пути — по раскладке aukus-svelte.

## Tiny Coast Pack

- Author: **Vryell** ([@Vryell](https://twitter.com/Vryell))
- Used for: angler sprite sheet, boat, sign and fishing rod (runtime art on the CDN, `<CDN_URL_BASE5>/minigames/fishing/fishing/`).
- License: free for commercial and non-commercial games and personal projects; modification allowed; credit is appreciated but not required.
- Restrictions: do not resell, repackage or redistribute the asset (even modified).
- The original pack is **not** included in this repository. The generated files on the CDN (`<CDN_URL_BASE5>/minigames/fishing/fishing/`) were produced from a separate copy of the «Tiny Coast Pack» that stays outside version control.

## Critters of Yonder — Gone Fishing

- Used for: all 40 freshwater and saltwater fish icons in the three-water-body roster (18 freshwater + 22 saltwater, including the shrimp).
- License: commercial and non-commercial games, personal projects and promotional materials; modification allowed; credit appreciated.
- Restrictions: do not resell, repackage or redistribute the asset (even modified); do not use it to train AI image generators; do not use it in logos, trademarks or service marks; do not include it in game-making tools or code templates; do not use it in crypto, NFT, p2e or meta projects.
- The original pack is **not** included in this repository. The generated icons on the CDN (`<CDN_URL_BASE5>/minigames/fishing/fishing/fish/`) were produced from a separate copy of the «Critters of Yonder — Gone Fishing» pack that stays outside version control.

## Stardew Valley sound effects

- Source: the sound effects and ambience from **Stardew Valley**, © ConcernedApe.
- Used for: UI clicks, cast/bite/reel/catch feedback and one ambience loop per water body (runtime files on the CDN, `<CDN_URL_BASE5>/minigames/fishing/fishing/sounds/`).
- Rights remain with the author. These files are included only because the project owner supplied them; do not redistribute the audio separately from this project.

## Input Prompts Pixel

- Author: **Kenney** (<https://www.kenney.nl>), pack «Input Prompts Pixel» (1.0).
- Used for: the mouse-with-pressed-left-button pictogram beside the cast prompt (`mouse-lmb.png` on the CDN, taken from `Tiles/tile_0077.png` of the pack; only the outline pixels are recoloured to the interface ink `UI.ink`, so the badge sits in the UI's own 1 px line), and the close and fullscreen marks of the HUD (`tile_0016.png` and `tile_0023.png` on the CDN, recoloured to the interface's `UI.ink`, `UI.primary` and `UI.periwinklePale`).
- License: Creative Commons Zero (CC0) — <http://creativecommons.org/publicdomain/zero/1.0/>.
- The original pack is **not** included in this repository.

## Chip icons (rod and hook)

- Source: two 16 px sheets supplied by the project owner (`fishing_rod_16x16.png`,
  `baits_16x16.png`), served from the CDN as `rod-sheet.png` and `baits-sheet.png`.
- Used for: the two marks of the touch cast/land chip (`ui/fight/FightControls.ts`)
  — the rod with its line and float for the cast, the bare hook for the catch.
- Rights remain with their author; the files are included only because the
  project owner supplied them. Do not redistribute them separately from this
  project.

## Tiny5

- Served from the CDN as four woff2 subsets in `<CDN_URL_BASE5>/minigames/fishing/fishing/fonts/` (`tiny5-latin`, `tiny5-latin-ext`, `tiny5-cyrillic`, `tiny5-cyrillic-ext`), split by `unicode-range` and loaded by `src/lib/minigames/fishing/engine/fonts.ts`. The original single TTF was 230 KB on the boot path; the subsets are ~18 KB together.
- License: SIL Open Font License 1.1 (OFL), source: <https://fonts.google.com/specimen/Tiny5>.

## Other

- All game code, UI layout, procedural Web Audio effects and Russian copy were written for this project.
- The frost veil ships as `<CDN_URL_BASE5>/minigames/fishing/ice-480.webp` (99 KB), baked from the original 2560×1440 cut-out by a one-off script that stays outside the repository; the Canvas downscale keeps the alpha silhouette bit-for-bit, and `src/lib/minigames/fishing/engine/ui/IceVeil.ts` only re-shapes the alpha at runtime.
- The winter trees and bush (`tree-a/b/c.png`, `bush-a.png` on the CDN) are procedurally generated pixel art, produced by one-off generation scripts that stay outside the repository. Shore stones are painted at runtime (`drawShoreStone`), so they have no sprite files.
- The DTF article “13 базовых принципов геймдизайна” was used as a design reference; no text from the article is reproduced.
