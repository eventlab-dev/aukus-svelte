import { clamp } from '../../../utils'
import { ditherNoise } from '../dither'

export interface LogShape {
	x: number
	y: number
	/** Direction of the trunk, radians. */
	angle: number
	length: number
	/** Half thickness at the root end (the cut face) and at the tip. */
	rootRadius?: number
	tipRadius?: number
	/**
	 * 0..1 share of the trunk sitting below the waterline. A floating log is
	 * mostly out of the water, so the default only drowns its lower third.
	 */
	submerged?: number
	/** Colour of that water; only read when the trunk is in the water. */
	water?: number
	/** 0..1 snow lying along the upper side. */
	snow?: number
	/** Sideways bend of the centreline, scene pixels. A real trunk is never straight. */
	bend?: number
	/** Deterministic bark seed, so a preview matches the live scene. */
	seed?: number
}

const EDGE_STEPS = 8
/**
 * Samples along the upper silhouette. Denser than {@link EDGE_STEPS} because
 * the bark flakes live on that edge and would be cut off by coarse sampling.
 */
const TOP_STEPS = 56
/** Bark flakes lifted off the upper side: few on a clean trunk, more on a rough. */
const STUB_MIN = 3
const STUB_SPREAD = 4

/** Derived trunk geometry, shared by the body and the waterline passes. */
export function buildLogGeometry(shape: LogShape) {
	const length = Math.max(8, shape.length)
	const half = length / 2
	const rootRadius = shape.rootRadius ?? 3.6
	const tipRadius = shape.tipRadius ?? rootRadius * 0.8
	// A floating trunk shows most of its body: the water only swallows the lower
	// quarter. The old 0.3 default left a 1.4-radius sliver above the surface,
	// which is a plank, not a log.
	const submerged = clamp(shape.submerged ?? 0.24)
	const snow = clamp(shape.snow ?? 0.8)
	const seed = shape.seed ?? 1
	/** Gentle curve of the trunk. Deadfall is never a straight beam. */
	const bend = shape.bend ?? ditherNoise(seed, 7) * 1.1
	/** Where the surface cuts the cylinder, as a share of its half thickness. */
	const waterShare = 1 - 2 * submerged

	const cos = Math.cos(shape.angle)
	const sin = Math.sin(shape.angle)
	/** Trunk-local (along, across) -> scene coordinates. */
	const toWorld = (u: number, v: number): [number, number] => {
		const t = clamp((u + half) / length)
		const across = v + Math.sin(Math.PI * t) * bend
		return [shape.x + u * cos - across * sin, shape.y + u * sin + across * cos]
	}
	const polyOf = (points: Array<[number, number]>): number[] => {
		const out: number[] = []
		for (const [u, v] of points) {
			const [x, y] = toWorld(u, v)
			out.push(x, y)
		}
		return out
	}
	/**
	 * Half thickness at `u`: a taper, a belly, a little rot unevenness, and a
	 * rounded cap at both ends. The cap matters: a trunk that stops on a flat
	 * disc reads as a pipe, and a bright disc at the top of a vertical log reads
	 * as a barrel standing on its end.
	 */
	const radiusAt = (u: number): number => {
		const t = clamp((u + half) / (2 * half))
		const body =
			rootRadius +
			(tipRadius - rootRadius) * t +
			Math.sin(Math.PI * t) * 0.3 +
			Math.sin(t * Math.PI * 3 + seed) * 0.28
		const cap = 0.55 + 0.45 * Math.min(1, Math.min(t, 1 - t) / 0.055)
		return body * cap
	}
	/** Edge at `share` of the local half-thickness (-1 top .. 1 underside). */
	const edge = (from: number, to: number, share: number): Array<[number, number]> => {
		const points: Array<[number, number]> = []
		for (let i = 0; i <= EDGE_STEPS; i += 1) {
			const u = from + ((to - from) * i) / EDGE_STEPS
			points.push([u, radiusAt(u) * share])
		}
		return points
	}
	/** The waterline, which never climbs past the trunk's edge at the thin ends. */
	const waterline: Array<[number, number]> = []
	for (let i = 0; i <= EDGE_STEPS; i += 1) {
		const u = -half + (length * i) / EDGE_STEPS
		const radius = radiusAt(u)
		waterline.push([u, Math.min(radius * waterShare, radius - 0.5)])
	}
	/** A closed strip of the cylinder between two shares. */
	const strip = (
		shareA: number,
		shareB: number,
		from = -half,
		to = half
	): Array<[number, number]> => [...edge(from, to, shareA), ...edge(to, from, shareB)]
	/**
	 * Branch stubs and knots lifted off the upper side, as a lift on the edge
	 * rather than as separate shapes.
	 *
	 * They used to be four identical trapezoids drawn on top of the finished
	 * trunk, which put them outside the stroked outline (a stepped brown ladder
	 * hanging off the top) and, being evenly spaced and evenly sized, made every
	 * log look stamped from the same die. They are now part of the edge, and each
	 * one is its own shape: a count that varies per log, uneven spacing, a
	 * different width on each side, and a crest that is sometimes flat (a sawn
	 * stub) and sometimes a point (a broken one).
	 *
	 * One of them is grown into a real broken branch. The sub-pixel flecks alone
	 * left the silhouette a smooth brown sausage — the single shape the eye reads
	 * fastest as "something that is not a tree". A branch that sticks up out of
	 * the water is the cheapest, clearest "this is a fallen trunk" cue the scale
	 * allows.
	 */
	const stubCount = STUB_MIN + Math.round(Math.abs(ditherNoise(seed, 3)) * STUB_SPREAD)
	/** Index that grows into the branch; picked from the seed, so it varies. */
	const branchIndex = Math.round(Math.abs(ditherNoise(seed, 17)) * (stubCount - 1))
	const stubs: Array<{
		centre: number
		left: number
		right: number
		height: number
		/** Share of the half-width taken by the shoulder, 0.15..0.9. */
		shoulder: number
	}> = []
	for (let i = 0; i < stubCount; i += 1) {
		const place = ditherNoise(i * 3 + 1, seed)
		const wide = ditherNoise(i * 5 + 2, seed + 7)
		const tall = ditherNoise(i * 7 + 3, seed + 13)
		const lean = ditherNoise(i * 11 + 4, seed + 29)
		// Positions are spread over 60% of the trunk with a jitter, so the gaps are
		// never equal — an evenly spaced row is what read as a stamped pattern.
		const span = (i + 0.5 + place * 0.9) / stubCount
		const centre = -half * 0.8 + length * 0.66 * span
		const branch = i === branchIndex
		// Wide enough that the 1 px outline cannot swallow the whole stub; the
		// branch is deliberately narrow, so its outline *is* its silhouette.
		const width = branch ? 1.1 + Math.abs(wide) * 0.8 : 2.2 + Math.abs(wide) * 3
		stubs.push({
			centre,
			left: width * (1 - Math.max(0, lean) * 0.45),
			right: width * (1 + Math.min(0, lean) * 0.45),
			// Measured against the trunk's own thickness: a fleck that is a third of
			// the radius is a visible knot, and the branch is a third again taller.
			height: branch ? 2.1 + Math.abs(tall) * 1.5 : 0.6 + Math.abs(tall) * 1.2,
			shoulder: branch ? 0.22 : 0.2 + Math.abs(place) * 0.7
		})
	}
	/** Trapezoid or spike: the crest follows the stub's own shoulder width. */
	const flakeLift = (u: number): number => {
		let lift = 0
		for (const stub of stubs) {
			const reach = u < stub.centre ? stub.left : stub.right
			const t = Math.abs(u - stub.centre) / reach
			if (t >= 1) continue
			lift = Math.max(lift, stub.height * Math.min(1, (1 - t) / stub.shoulder))
		}
		return lift
	}
	/**
	 * Upper silhouette: the taper, sampled coarsely, plus the stub corners. The
	 * corners are real vertices — a densely sampled curve would round every stub
	 * off into a lump and the top edge would read as a caterpillar.
	 */
	const topUs: number[] = []
	for (let i = 0; i <= TOP_STEPS; i += 1) {
		topUs.push(-half + (length * i) / TOP_STEPS)
	}
	for (const stub of stubs) {
		topUs.push(
			stub.centre - stub.left,
			stub.centre - stub.left * (1 - stub.shoulder),
			stub.centre + stub.right * (1 - stub.shoulder),
			stub.centre + stub.right
		)
	}
	topUs.sort((a, b) => a - b)
	const topEdge: Array<[number, number]> = []
	let previous = -Infinity
	for (const u of topUs) {
		// Duplicates would draw a zero-length segment; the outline miter chokes on
		// those and spits out a spike.
		if (u - previous < 0.05) continue
		previous = u
		topEdge.push([u, -(radiusAt(u) + flakeLift(u))])
	}
	/** Open path through trunk-local points. */

	const above = polyOf([...topEdge, ...[...waterline].reverse()])
	return {
		length,
		half,
		rootRadius,
		tipRadius,
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
	}
}
