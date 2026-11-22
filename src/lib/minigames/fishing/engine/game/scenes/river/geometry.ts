import { VIEW } from '../../../config'

export type BankPoint = readonly [number, number]

/**
 * Waterlines as (x, y) control points, smoothed in between: the river runs
 * between `FAR_BANK` (top) and `NEAR_BANK` (bottom). The far bank leaves the
 * frame through the top edge on the left and the near bank through the bottom
 * edge on the right, so the water continues past both ends of the reach instead
 * of ending against a bank.
 */
export const FAR_BANK: readonly BankPoint[] = [
	[0, -40],
	[40, -26],
	[80, -8],
	[110, 8],
	[140, 24],
	[180, 42],
	[230, 50],
	[300, 54],
	[360, 60],
	[420, 72],
	[480, 92]
]

export const NEAR_BANK: readonly BankPoint[] = [
	[0, 158],
	[30, 170],
	[60, 184],
	[96, 202],
	[130, 211],
	[170, 219],
	[220, 228],
	[280, 237],
	[340, 244],
	[400, 250],
	[480, 268]
]

/** Y rows covered by the depth gradient; 1px rows keep the ramp banding-free. */
export const WATER_TOP = 0
/** The near bank reaches the bottom edge on the right, so the ramp runs low. */
export const WATER_BOTTOM = VIEW.height - 2

/**
 * Cold stone for the boulders in the current. They are read against teal water
 * and pale snow, so the body is blue-grey and never warm: a warm rock next to
 * snow reads as floating debris rather than as stone.
 */
export const STONE = {
	dark: 0x35434b,
	mid: 0x51636c,
	light: 0x76888f,
	lit: 0x9db0b5
} as const

/**
 * Boulders standing in the current. The static pass paints them and the motion
 * pass needs their waterline, so the list lives in one place.
 */
export const BOULDERS: readonly { x: number; y: number; size: number }[] = [
	{ x: 118, y: 84, size: 8 },
	{ x: 404, y: 104, size: 7 },
	{ x: 392, y: 214, size: 6 }
]

export interface Drift {
	/** Position across the channel: 0 is the far bank, 1 the near one. */
	offset: number
	x: number
	speed: number
	rx: number
	ry: number
	/** Unit polygon of the ice slab, flattened for the water plane. */
	shape: number[]
}

export interface Bubble {
	x: number
	y: number
	phase: number
	speed: number
}

export interface Ripple {
	x: number
	y: number
	length: number
	slope: number
	alpha: number
}

/**
 * One spruce on the banks.
 *
 * The river used to draw its firs in code: nested polygons, a lit wedge and a
 * shaded wedge per tier. They read well on their own, but next to the sprite
 * spruces of the lake and the bay they looked like a different artist's trees,
 * so every fir here is now a sprite from the same sheet. Only the scale, the
 * tint and the flip differ per row, which is what separates the far ranks from
 * the ones framing the bank.
 */
export interface BankTree {
	x: number
	base: number
	height: number
	tint: number
	flip: boolean
	/** Snow collar at the trunk; 0 keeps the back row cheap. */
	drift: number
	/** True for the front row, whose silhouette is mirrored in the water. */
	reflect?: boolean
}

/** Height of the drawn tree inside the 52×60 sprite, in sprite pixels. */
export const TREE_BODY = 55

/**
 * Shared size band for every fir in the round, in sprite pixels.
 *
 * The lake and the bay plant their spruces between roughly 0.95 and 1.25 of the
 * sheet; the river keeps the same band so switching water does not change the
 * apparent zoom of the forest. Depth is carried by the tint, not the scale.
 */
export const TREE_MIN = 52
export const TREE_MAX = 68

/** Smoothstep between control points so the banks never kink. */
export function bankAt(points: readonly BankPoint[], x: number): number {
	const first = points[0]
	const last = points[points.length - 1]
	if (x <= first[0]) return first[1]
	if (x >= last[0]) return last[1]
	for (let i = 0; i < points.length - 1; i += 1) {
		const a = points[i]
		const b = points[i + 1]
		if (x <= b[0]) {
			const t = (x - a[0]) / (b[0] - a[0])
			return a[1] + (b[1] - a[1]) * (t * t * (3 - 2 * t))
		}
	}
	return last[1]
}

/** Deterministic 0..1 noise: the scene must look identical in previews. */
export function noise(index: number, salt = 0): number {
	const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
	return value - Math.floor(value)
}
