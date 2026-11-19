import { TAU } from './constants'

/** Shortest signed rotation from `from` to `to`, in radians. */
export function angleDelta(from: number, to: number): number {
	let delta = (to - from + Math.PI) % TAU
	if (delta < 0) delta += TAU
	return delta - Math.PI
}
