import type { Graphics } from 'pixi.js'
import { UI } from '../../ui/palette'
import { clamp } from '../../utils'
import { zoneTuning } from '../fight/zoneTuning'

/**
 * The padlock that seals a landed counter, drawn around the float.
 *
 * One mark says the jerk was cancelled: the float is what the player tracks, so
 * the lock hangs on it instead of on the fish that is already hidden by its own
 * stun. Shape, size, lift and the fade are the panel's (`zoneTuning`), so the
 * same call draws the fight's lock and the tuner's sample — a preview that lies
 * about the mark would be worse than none.
 *
 * No contact shadow: the mark rides *on* the float, and a dark ellipse under it
 * read as a second object stuck to the waterline.
 *
 * `lit` is 0..1: how far the mark has come in or has already faded.
 */
export function drawCounterLock(g: Graphics, x: number, y: number, lit: number): void {
	const tuning = zoneTuning
	const alpha = clamp(lit)
	if (alpha <= 0.002) return
	const px = Math.max(1, Math.round(tuning.lockScale))
	const cy = Math.round(y) + Math.round(tuning.lockLift)

	// Body: a dark plate with a lit face, so it reads on water and on a panel.
	g.rect(Math.round(x) - 3 * px, cy, 6 * px, 5 * px).fill({
		color: UI.ink,
		alpha: 0.9 * alpha
	})
	g.rect(Math.round(x) - 2 * px, cy + px, 4 * px, 3 * px).fill({
		color: UI.ice,
		alpha: 0.95 * alpha
	})
	// Keyhole, then the shackle over the top edge.
	g.rect(Math.round(x) - px, cy + 2 * px, 2 * px, px).fill({
		color: UI.ink,
		alpha: 0.95 * alpha
	})
	g.moveTo(Math.round(x) - 2 * px, cy)
		.lineTo(Math.round(x) - 2 * px, cy - 2 * px)
		.lineTo(Math.round(x) + px, cy - 2 * px)
		.lineTo(Math.round(x) + px, cy)
		.stroke({ width: px, color: UI.ice, alpha: 0.95 * alpha })
}

/** Where the lock hangs: the float the player watches, or the fish it marks. */
export function counterLockPoint(point: {
	float: { x: number; y: number }
	fish: { x: number; y: number }
}): { x: number; y: number } {
	return zoneTuning.lockAtFloat ? point.float : point.fish
}
