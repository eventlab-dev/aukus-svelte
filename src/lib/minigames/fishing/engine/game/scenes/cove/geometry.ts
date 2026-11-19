export const SHORE_X = 54
export const DOCK = { x: 48, y: 122, width: 124, bottom: 152 }
/** Rowboat moored along the underside of the pier. */
export const MOORED_BOAT = { x: 134, y: 174 }

export interface Ripple {
	x: number
	y: number
	length: number
	bend: number
	slope: number
	alpha: number
	width: number
	color: number
}

export interface WaterMark {
	x: number
	y: number
	radius: number
	phase: number
	speed: number
	alpha: number
}

export interface Whirl {
	x: number
	y: number
	radius: number
	phase: number
	spin: number
	alpha: number
}

/** A sparkle that blinks on the open water. */
export interface Glint {
	x: number
	y: number
	phase: number
	speed: number
	size: number
}

export interface ScenerySpot {
	x: number
	y: number
	scale: number
	flip?: boolean
}

/** Deterministic 0..1 noise: the sea surface must match in every preview. */
export function noise(index: number, salt = 0): number {
	const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
	return value - Math.floor(value)
}
