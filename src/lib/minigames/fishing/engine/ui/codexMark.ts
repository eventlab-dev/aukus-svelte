import type { Graphics } from 'pixi.js'
import { UI } from './palette'

/**
 * Book mark of the HUD's codex control: a cover, two blocks of paper with ruled
 * entries and a bookmark down the gutter.
 *
 * It fills the same 12×12 body as the pause bars beside it (`drawPauseIcon`
 * spans y 2–13 too): the two controls are one pair in 16 px buttons, and the
 * reference is the one that carries text, so it spends the body on a cover, two
 * pages and a bookmark, while the pause spends it on two bars.
 *
 * The contour is the 2 px ink plate of the close and fullscreen tiles, not the
 * 1 px frame this mark used to carry: those tiles ship with a solid 2 px plate,
 * and side by side in the HUD the book looked printed in a lighter weight than
 * its neighbours. The plate now wraps the whole 12×12 body, and the pale cover,
 * the ice pages and the bookmark sit inside it, so the pair carries one weight.
 *
 * Nothing here is warm: the cover is periwinkle-pale, the paper is the
 * interface's ice white, the entries are periwinkle and the contour is ink, so
 * the only accent is the bookmark. A gold cover was the first draft and it
 * became the loudest thing on the frame, louder than the amber the landing cue
 * owns.
 */
export function drawCodexMark(g: Graphics): void {
	g.clear()
	// 12×12 ink plate with its four corners cut by one pixel, two columns of air
	// on every side of the 16 px box. The chamfer is what keeps the plate reading
	// as a tile rather than as a window frame around the pages.
	const left = 2
	const top = 2
	g.rect(left + 1, top, 10, 12).fill(UI.ink)
	g.rect(left, top + 1, 12, 10).fill(UI.ink)
	// Cover: the pale ring inside the plate, one pixel of it on every side.
	g.rect(left + 2, top + 2, 8, 8).fill(UI.periwinklePale)
	// Paper: two pages, each a block of entries.
	g.rect(left + 3, top + 3, 2, 5).fill(UI.primary)
	g.rect(left + 7, top + 3, 2, 5).fill(UI.primary)
	// Entries ruled on the pages.
	for (const row of [4, 6] as const) {
		g.rect(left + 3, top + row, 2, 1).fill(UI.periwinkle)
		g.rect(left + 7, top + row, 2, 1).fill(UI.periwinkle)
	}
	// Bookmark down the gutter: two columns from the top of the pages to the
	// cover's bottom edge, so the tabs of the pages still show above it.
	g.rect(left + 5, top + 3, 2, 7).fill(UI.danger)
}
