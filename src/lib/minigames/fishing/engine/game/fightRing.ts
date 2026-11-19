/**
 * The shape of the fight zone.
 *
 * The ring is not a circle: it is a slow, irregular wobble so it reads as water
 * rather than as a drawn circle. The darkening behind the fight has to be cut
 * along the very same contour, or the spot looks lit by a spotlight instead of
 * being the only place the water is still visible — hence one shared definition
 * instead of two lookalike curves that drift apart.
 */

/** Points around the zone outline. Below ~48 the wobble turns into corners. */
export const RING_SEGMENTS = 72

/**
 * Radius of the zone at `angle`.
 *
 * `line` indexes the concentric outline (the ring draws two of them), `time`
 * animates the wobble: the primary swell drifts one way, the ripple the other,
 * so the edge never visibly repeats.
 */
export function ringRadiusAt(angle: number, radius: number, line: number, time: number): number {
	const primary = Math.sin(angle * (5 + line) + time * (0.8 + line * 0.17))
	const ripple = Math.sin(angle * (11 + line * 2) - time * (1.35 + line * 0.2))
	return radius + primary * (1.6 + line * 0.35) + ripple * 0.7
}

/** Closed outline of the zone as a flat `[x, y, ...]` list in scene space. */
export function ringOutline(
	cx: number,
	cy: number,
	radius: number,
	line: number,
	time: number,
	segments = RING_SEGMENTS
): number[] {
	const points: number[] = []
	for (let i = 0; i < segments; i += 1) {
		const angle = (i / segments) * Math.PI * 2
		const r = ringRadiusAt(angle, radius, line, time)
		points.push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r)
	}
	return points
}
