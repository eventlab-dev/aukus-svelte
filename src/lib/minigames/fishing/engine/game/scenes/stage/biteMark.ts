import type { Graphics } from 'pixi.js'
import { C } from '../../../config'

/**
 * The bite mark: the exclamation that pops over the float when a fish takes the
 * bait.
 *
 * It used to be the font's own «!» at 22 px with a three-pixel stroke — a text
 * glyph promoted to a scene object. Next to the drawn art it read as a piece of
 * interface that had escaped its panel: the stroke was soft, the dot was a
 * typeface's dot, and the whole mark sat on the water like a label rather than
 * something the float threw up. It is drawn here instead, the way the float and
 * the warning arrows are: an ink silhouette, a gold body, one lit pixel column
 * on the left, and a dot that lines up with the bar's own taper.
 *
 * The origin is the bottom centre of the dot, so the caller can hang it over the
 * float by its tip and let the bounce move only its y.
 */

/** Height of the mark above its origin, in scene pixels. */
export const BITE_MARK_HEIGHT = 16

/** Tapered bar: wide at the top, one pixel narrower as it runs down. */
const BAR = [-2, -15, 1, -15, 1, -7, 0, -6, -1, -6, -2, -7]

/** The dot under it, the same width as the bar's head. */
const DOT = [-2, -3, 1, -3, 1, 0, -2, 0]

export function drawBiteMark(g: Graphics): void {
	g.clear()
	// Bar and dot as two silhouettes: gold body, then an outline laid down on the
	// outside of it (`alignment: 0`), so the ink never eats into the mark.
	g.poly(BAR).fill(C.gold)
	g.poly(BAR).stroke({ width: 1, color: C.ink, alignment: 0 })
	g.poly(DOT).fill(C.gold)
	g.poly(DOT).stroke({ width: 1, color: C.ink, alignment: 0 })

	// Lit edge on the left of the bar and one bright pixel on the dot: the same
	// light direction the boat and the float are drawn with.
	g.rect(-1, -14, 1, 6).fill({ color: C.yellow, alpha: 0.85 })
	g.rect(-1, -2, 1, 1).fill({ color: C.yellow, alpha: 0.9 })
}
