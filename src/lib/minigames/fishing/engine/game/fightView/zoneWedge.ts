import type { Graphics } from 'pixi.js'
import { zoneArc, zoneInner, zoneOuter, zoneTuning } from '../fight/zoneTuning'

/**
 * One zone of the fight ring: the band around `heading` a press can come from.
 *
 * Drawn from the very numbers the model tests against (`zoneTuning`: the same
 * half-angle, the same inner edge, the same depth), so the highlight *is* the
 * rule and not an illustration of it: a press anywhere in the rose zone is a
 * valid grab. The shape is never eased — only its opacity and its colour move.
 *
 * `alpha` is the whole zone's 0..1 visibility (fade in, fade out, the feint's
 * delay), `tone` its colour (grey once a counter has landed). The rim is drawn
 * inside or outside the edge, never centred on it: a centred stroke would paint
 * half a pixel of zone where the model accepts no press, and half a pixel of
 * water inside it.
 */
export function drawZoneWedge(
	g: Graphics,
	cx: number,
	cy: number,
	heading: number,
	alpha: number,
	tone: number
): void {
	if (alpha <= 0.002) return
	const arc = zoneArc()
	const inner = zoneInner()
	const outer = zoneOuter()
	const from = heading - arc
	const to = heading + arc
	const steps = 12
	const at = (angle: number, radius: number): [number, number] => [
		cx + Math.cos(angle) * radius,
		cy + Math.sin(angle) * radius
	]

	const points: number[] = []
	for (let i = 0; i <= steps; i += 1) {
		points.push(...at(from + ((to - from) * i) / steps, outer))
	}
	for (let i = steps; i >= 0; i -= 1) {
		points.push(...at(from + ((to - from) * i) / steps, inner))
	}

	const tuning = zoneTuning
	g.poly(points).fill({ color: tone, alpha: tuning.fill * alpha })
	g.poly(points).stroke({
		width: tuning.rimWidth,
		color: tone,
		alpha: tuning.rim * alpha,
		// Pixi: 1 paints inside the path, 0 outside it, 0.5 centres on the edge.
		alignment: tuning.rimOutside ? 0 : 1
	})
}
