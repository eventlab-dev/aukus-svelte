import type { Graphics } from 'pixi.js'
import { UI } from './palette'

/**
 * Pixel padlock: a 7×9 glyph drawn from whole pixels, multiplied by `scale`.
 *
 * The same mark seals a closed location in the water picker, the travel cards
 * and anywhere else the host has closed a door, so a locked water body is
 * recognised by its shape before any of its labels are read. `body` carries the
 * fill and `face` the keyhole, so the mark can sit on a dark plate or on a
 * bright one without a second variant.
 *
 * `edge` adds one pixel of contour around the silhouette. The gauge uses it:
 * a padlock that only changed its fill still dissolved into the red liquid
 * underneath it, and the contour is what keeps the mark whole on a surface that
 * is red on one side of the level and dark glass on the other.
 */
export function drawLockMark(
	g: Graphics,
	x: number,
	y: number,
	scale = 1,
	body: number = UI.periwinkle,
	face: number = UI.ink,
	edge?: number
): void {
	const px = Math.max(1, Math.round(scale))
	const block = (dx: number, dy: number, w: number, h: number, color: number) => {
		g.rect(x + dx * px, y + dy * px, w * px, h * px).fill(color)
	}
	// The silhouette as whole-pixel blocks: three shackle steps, so it reads as a
	// rounded handle and not a box, then the body.
	const shape: ReadonlyArray<readonly [number, number, number, number]> = [
		[2, 0, 3, 1],
		[1, 1, 1, 2],
		[5, 1, 1, 2],
		[0, 3, 7, 6]
	]
	if (edge !== undefined) {
		// Painted first and grown by a pixel, so the union is a 1 px contour behind
		// every part of the mark.
		for (const [dx, dy, w, h] of shape) {
			block(dx - 1, dy - 1, w + 2, h + 2, edge)
		}
	}
	for (const [dx, dy, w, h] of shape) {
		block(dx, dy, w, h, body)
	}
	// A lit top lip that separates the body from the shackle.
	block(0, 3, 7, 1, UI.periwinklePale)
	// Keyhole: a round hole over a slot.
	block(3, 5, 1, 1, face)
	block(3, 6, 1, 2, face)
}
