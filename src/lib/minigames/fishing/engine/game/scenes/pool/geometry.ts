export const CENTER = { x: 240, y: 132 }
export const RADIUS = { x: 200, y: 118 }
export const SHORE_POINTS = 128
/**
 * The deep basin sits off-centre, toward the far right of the hole, and its
 * outline is far more ragged than the shoreline. Depth is never a bullseye.
 */
export const DEEP = { x: 276, y: 140 }
export const DEEP_RADIUS = { x: 46, y: 30 }
/**
 * Depth is painted as ~100 nested contours. That is far more than the shape
 * needs on purpose: neighbours then differ by a single colour unit, so the
 * ramp reads as smooth water instead of visible steps. The contours are drawn
 * as thin bands, not stacked discs, so the fill rate stays at one layer.
 */
export const DEPTH_LAYERS = 96

export interface IceDisc {
	x: number
	y: number
	rx: number
	ry: number
	alpha: number
}

export interface Wisp {
	x: number
	y: number
	phase: number
	speed: number
	radius: number
}

export interface Bubble {
	x: number
	y: number
	speed: number
	phase: number
}

/** Dark forest lake: water almost all the way to the frame, a raft, reeds. */
