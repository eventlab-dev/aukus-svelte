import type { Graphics } from 'pixi.js'
import { clamp } from '../../../utils'
import { mixColor } from '../../../world'
import { ditherNoise } from '../dither'
import { buildLogGeometry, type LogShape } from './geometry'

export type { LogShape } from './geometry'

/** Colours the trunk borrows from the water body it floats in. */
export interface LogPalette {
	ice: number
	snow: number
	snowLight: number
}

const BARK = 0x6d6455
const BARK_DARK = 0x40392f
const BARK_LIT = 0x9b9284
const BARK_RIDGE = 0x50483b
const END_GRAIN = 0xb7ab92
const END_GRAIN_DARK = 0x827663
const OUTLINE = 0x191510
/** Underwater bulk: the trunk's own dark, seen through the water. */
const HULL = 0x1c2a2c

export function drawFloatingLog(g: Graphics, shape: LogShape, palette: LogPalette): void {
	const {
		length,
		half,
		submerged,
		snow,
		seed,
		waterShare,
		toWorld,
		polyOf,
		radiusAt,
		edge,
		strip,
		waterline,
		above
	} = buildLogGeometry(shape)

	const strokePath = (
		points: Array<[number, number]>,
		style: { width: number; color: number; alpha: number }
	): void => {
		const flat = polyOf(points)
		g.moveTo(flat[0], flat[1])
		for (let i = 2; i < flat.length; i += 2) g.lineTo(flat[i], flat[i + 1])
		g.stroke(style)
	}
	const ellipse = (
		u: number,
		radiusAlong: number,
		radiusAcross: number,
		vCentre = 0
	): Array<[number, number]> => {
		const points: Array<[number, number]> = []
		for (let i = 0; i < 12; i += 1) {
			const angle = (i / 12) * Math.PI * 2
			points.push([u + Math.cos(angle) * radiusAlong, vCentre + Math.sin(angle) * radiusAcross])
		}
		return points
	}

	// --- the water answers the trunk first --------------------------------
	// The drowned bulk, seen through the surface. It is a shadow on the water, so
	// it is offset in *screen* space (down and slightly right), not perpendicular
	// to the trunk: a top-down lake does not light the log from its own side.
	const shiftX = 1.5
	const shiftY = 2
	const hull = polyOf([...edge(-half, half, -0.92), ...edge(half, -half, 1)]).map((value, index) =>
		index % 2 === 0 ? value + shiftX : value + shiftY
	)
	g.poly(hull).fill({
		color: mixColor(shape.water ?? HULL, HULL, 0.6),
		alpha: 0.34
	})

	// Ripples break at the two ends, where the trunk cuts the surface, plus one
	// broken line along the waterline. A closed ring around the whole trunk reads
	// as a painted plate. A trunk lying on dry snow has no surface to break, so
	// none of this is drawn for it — it only gets the shadow above.
	//
	// One thin, water-tinted arc per end, not the pair of bright ice rings the
	// trunk used to wear: at this size two pale ellipses around a 9 px body made
	// the log glow, which is exactly what made it read as a soft floating lump
	// instead of a hard piece of wood.
	if (submerged > 0.01) {
		const ripple = mixColor(palette.ice, shape.water ?? HULL, 0.5)
		for (const sign of [-1, 1] as const) {
			const endU = sign * half * 0.9
			const radius = radiusAt(sign * half)
			g.poly(polyOf(ellipse(endU, radius + 2.2, (radius + 2.2) * 0.55, radius * 0.35))).stroke({
				width: 1,
				color: ripple,
				alpha: Math.max(0.06, 0.2 - submerged * 0.1)
			})
		}
	}

	// --- the trunk above the water ----------------------------------------
	g.poly(above).fill(BARK)
	// Cylinder light as pixel art: one lit ridge along the top and one wet shadow
	// just above the waterline. Wide alpha bands split the trunk in half and read
	// as a beam with a black side.
	g.poly(polyOf(strip(-1, -0.7))).fill(BARK_LIT)
	g.poly(polyOf(strip(Math.min(waterShare, 0.55), waterShare))).fill(BARK_DARK)

	// Bark plates: broad, uneven patches of a darker and a lighter tone running
	// along the body. One-pixel grain lines alone are not readable at this size —
	// they vanish into a single flat brown, which is what made the trunk look
	// like a smooth extruded sausage. Plates are what the eye actually reads as
	// bark from a metre away.
	const plateCount = Math.max(3, Math.round(length / 8))
	for (let i = 0; i < plateCount; i += 1) {
		const noise = ditherNoise(i + 61, seed)
		const centre = -half + (length * (i + 0.5)) / plateCount + noise * 2
		const plateWidth = 2.4 + Math.abs(noise) * 3.2
		const from = clamp(centre - plateWidth / 2, -half + 0.6, half - 0.6)
		const to = clamp(centre + plateWidth / 2, -half + 0.6, half - 0.6)
		if (to - from < 0.8) continue
		const top = -0.86 + (i % 3) * 0.22 + Math.abs(noise) * 0.12
		const bottom = Math.min(waterShare - 0.05, top + 0.42 + Math.abs(noise) * 0.3)
		if (bottom <= top) continue
		g.poly(polyOf(strip(top, bottom, from, to))).fill({
			color: noise > 0 ? BARK_RIDGE : BARK_LIT,
			alpha: noise > 0 ? 0.34 : 0.2
		})
	}

	// Bark ridges run along the trunk, cracks cut across it. Deterministic, so
	// the menu preview and the live scene show the same log.
	//
	// The end point is expressed as a share of the thickness *there*, not as an
	// absolute offset: a fixed offset left the line hanging past the tapering
	// cap, a pale scratch floating above the contour.
	const grainCount = Math.max(4, Math.round(length / 6))
	for (let i = 0; i < grainCount; i += 1) {
		const noise = ditherNoise(i + 1, seed)
		const u = -half + (length * (i + 0.5)) / grainCount + noise * 1.6
		const across = -0.9 + (i % 3) * 0.5
		if (across > waterShare - 0.1) continue
		const uEnd = u + 2.2 + Math.abs(noise) * 3.4
		const endShare = clamp(across + noise * 0.12, -0.92, waterShare - 0.12)
		const from = toWorld(u, radiusAt(u) * across)
		const to = toWorld(uEnd, radiusAt(uEnd) * endShare)
		g.moveTo(from[0], from[1])
			.lineTo(to[0], to[1])
			.stroke({
				width: 1,
				color: noise > 0 ? BARK_RIDGE : BARK_LIT,
				alpha: noise > 0 ? 0.65 : 0.3
			})
	}

	// Rough silhouette: the bark flakes are already part of `above` (see
	// `flakeLift`), so the fill and the outline agree on where the top edge is.

	// End grain: the pale cut face at the root end, and a darker broken one at
	// the tip. This is the single most "it is a piece of timber" feature at this
	// size — without it the trunk is a brown capsule.
	//
	// It also has to *fit*: the trunk tapers into a rounded cap and its lower
	// part is under water, so an ellipse sized off the body radius used to step
	// out past both the outline and the waterline and read as a little brown
	// ladder hanging off the end of every log. The face is measured on the slice
	// that is actually above the surface, and the old 0.55-radius clamp made it a
	// one-pixel sliver that nobody could see, which is how the trunk lost its cut
	// end in the first place.
	const face = (
		u: number,
		radiusAlong: number,
		acrossShare: number,
		fill: number,
		alpha: number
	): void => {
		const radius = radiusAt(u)
		/** The slice of trunk at `u` that is out of the water. */
		const top = -radius
		const surface = Math.min(radius * waterShare, radius - 0.5)
		const across = Math.max(0.4, ((surface - top) / 2 - 0.2) * acrossShare)
		const centre = (top + surface) / 2
		const rim = polyOf(ellipse(u, radiusAlong, across, centre))
		g.poly(rim).fill({ color: fill, alpha })
		g.poly(rim).stroke({ width: 1, color: OUTLINE, alpha: 0.35 })
	}
	face(half - 1.5, 1.3, 0.92, END_GRAIN, 0.92)
	face(-half + 1.2, 0.8, 0.72, END_GRAIN_DARK, 0.6)

	// --- snow --------------------------------------------------------------
	// Snow settles as crusty patches along the upper side. One continuous stroke
	// along the top edge reads as a highlight instead, and the dashes that
	// replaced it looked like a zip.
	//
	// Painted before the outline: a patch that reaches the silhouette used to be
	// laid over the finished contour, which left pale crumbs above the top edge.
	if (snow > 0.05) {
		for (let i = 0; i < 3; i += 1) {
			const noise = ditherNoise(i + 31, seed)
			const centre = -half * 0.6 + (length * 0.4 * i) / 2
			const width = 2.4 + Math.abs(noise) * 3
			const depth = 0.12 + Math.abs(ditherNoise(i + 5, seed)) * 0.14
			const patch: Array<[number, number]> = []
			const steps = 4
			for (let k = 0; k <= steps; k += 1) {
				const u = centre - width + (2 * width * k) / steps
				const radius = radiusAt(u)
				patch.push([u, -radius + radius * depth])
			}
			for (let k = steps; k >= 0; k -= 1) {
				const u = centre - width + (2 * width * k) / steps
				const radius = radiusAt(u)
				patch.push([u, -radius + (k % 2 === 0 ? 0.1 : 0.7)])
			}
			g.poly(polyOf(patch)).fill({
				color: palette.snow,
				alpha: 0.6 * snow
			})
		}
	}

	// --- waterline ---------------------------------------------------------
	// The bright lip is the single strongest "floating" cue: the surface climbs
	// the bark, so it catches the cold sky right where the wood leaves the water.
	// The contour is stroked last so nothing can end up outside it, and with a
	// round join: the bark humps are shallow, but a miter at their shoulders
	// still throws a spike a pixel or two clear of the log.
	g.poly(above).stroke({
		width: 1,
		color: OUTLINE,
		alpha: 0.85,
		join: 'round'
	})
	if (submerged > 0.01) {
		strokePath(waterline, {
			width: 1,
			color: mixColor(palette.ice, palette.snowLight, 0.45),
			alpha: 0.5
		})
		strokePath(
			waterline.map(([u, v]) => [u, v + 1] as [number, number]),
			{ width: 1, color: HULL, alpha: 0.5 }
		)
	}
}
