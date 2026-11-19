import type { Graphics } from 'pixi.js'
import { VIEW } from '../../config'
import { winterWaterAt } from '../../world'

/**
 * Deterministic -1..1 noise. Water gradients are dark and flat, so an 8-bit
 * colour ramp always ends up showing one-unit bands; pushing the band edges
 * around by a hash scatters those bands into grain the eye reads as water.
 */
export function ditherNoise(a: number, b: number): number {
	const value = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453
	return (value - Math.floor(value)) * 2 - 1
}

export interface DepthRamp {
	/** Axis the depth changes along. */
	axis: 'x' | 'y'
	/** Start and end of the ramp along that axis, in scene units. */
	from: number
	to: number
	stops: readonly { at: number; color: number }[]
	/** `true` when the deep end is at `from` instead of `to`. */
	reverse?: boolean
	/** Colour bands; keep neighbours a colour unit or two apart. */
	bands?: number
	/** How far a band edge wanders, in scene units. Defaults to under half. */
	wobble?: number
	/** Sample step along the band edge, in scene units. */
	step?: number
}

/**
 * Paints a depth ramp as thin colour bands whose boundaries are dithered.
 *
 * The bands span the whole frame across the ramp axis, so the caller is
 * expected to paint the banks, pier or anything else on top. Each boundary is
 * shared by its two neighbours, which keeps the water free of hairline seams.
 */
export function drawDepthRamp(g: Graphics, ramp: DepthRamp): void {
	const bands = ramp.bands ?? 72
	const step = ramp.step ?? 1
	const pitch = Math.abs(ramp.to - ramp.from) / bands
	// Just under half a band: neighbours interlock without ever crossing.
	const wobble = ramp.wobble ?? pitch * 0.35
	const across = ramp.axis === 'x' ? VIEW.height : VIEW.width

	const edge = (index: number, u: number): number => {
		const base = ramp.from + ((ramp.to - ramp.from) * index) / bands
		if (index === 0 || index === bands) return base
		return base + ditherNoise(index, Math.round(u / step)) * wobble
	}

	for (let i = 0; i < bands; i += 1) {
		const t = (i + 0.5) / bands
		const points: number[] = []
		const push = (u: number, v: number): void => {
			if (ramp.axis === 'x') points.push(v, u)
			else points.push(u, v)
		}
		for (let u = 0; u <= across; u += step) push(u, edge(i, u))
		for (let u = across; u >= 0; u -= step) push(u, edge(i + 1, u))
		g.poly(points).fill(winterWaterAt(ramp.reverse ? 1 - t : t, ramp.stops))
	}
}
