import type { Graphics } from 'pixi.js'
import { C, FIGHT } from '../../../config'
import { clamp } from '../../../utils'
import { STAMINA_ARC_RADIUS } from './setup'

/**
 * The gauge is a shallow stub under the float, not a half-ring: it used to wrap
 * most of the float and read as a second outline of the bobber. A quarter turn
 * is enough to show a 0..1 value and leaves the waterline ring around the float
 * alone.
 */
const FROM = Math.PI * 0.25
const TO = Math.PI * 0.75
const SPAN = TO - FROM

/**
 * The fish's remaining endurance, as a thick stub under the float.
 *
 * It used to be the escape clock, but a second pressure gauge next to the
 * sinking float told the player the same thing twice. The float now owns the
 * escape cue — the more the fish pulls away, the deeper it goes under — and
 * this arc answers the other question: how much fight is left in the fish. It
 * drains from the right end towards the left as the fish tires.
 *
 * The arc is drawn in the float's local space, so it follows the bobber as the
 * fish drags it around the ring.
 *
 * No highlight lives here any more: the breathing outline is gone, the gauge is
 * a plain track and fill. The catch window is announced by the amber ring around
 * the float and by the chime, and the threshold notch (see
 * {@link drawStaminaThreshold}) keeps its own layer.
 */
export function drawFishStamina(g: Graphics, value: number): void {
	g.clear()
	const stamina = clamp(value)
	const color = stamina <= 0.5 ? C.gold : C.cyan

	g.arc(0, 0, STAMINA_ARC_RADIUS, FROM, TO).stroke({
		width: 3,
		color: C.ink,
		alpha: 0.3,
		cap: 'round'
	})
	if (stamina > 0.01) {
		g.arc(0, 0, STAMINA_ARC_RADIUS, FROM, FROM + SPAN * stamina).stroke({
			width: 2,
			color,
			alpha: 0.95,
			cap: 'round'
		})
	}
}

/**
 * The landing threshold, drawn on a layer of its own.
 *
 * A short notch across the gauge, exactly where it has always been — but in its
 * own Graphics instead of the gauge's: the gauge is repainted every frame and the
 * tick does not change, so keeping them on separate layers means the threshold
 * mark can be placed, tinted or toggled without touching the arc.
 */
export function drawStaminaThreshold(g: Graphics): void {
	g.clear()
	const threshold = FROM + SPAN * FIGHT.landThreshold
	const cos = Math.cos(threshold)
	const sin = Math.sin(threshold)
	g.moveTo(cos * (STAMINA_ARC_RADIUS - 2.5), sin * (STAMINA_ARC_RADIUS - 2.5))
		.lineTo(cos * (STAMINA_ARC_RADIUS + 2.5), sin * (STAMINA_ARC_RADIUS + 2.5))
		.stroke({ width: 1, color: C.cream, alpha: 0.85 })
}
