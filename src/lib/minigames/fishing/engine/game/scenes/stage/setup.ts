import { Sprite } from 'pixi.js'
import { TIMING } from '../../../config'
import { easeOutCubic } from '../../../utils'

export type ScenePhase = 'idle' | 'flying' | 'waiting' | 'bite' | 'fight' | 'result'

export interface Particle {
	x: number
	y: number
	vx: number
	vy: number
	life: number
	maxLife: number
	size: number
	color: number
}

export interface Ring {
	x: number
	y: number
	radius: number
	maxRadius: number
	life: number
	maxLife: number
}

export interface Jump {
	sprite: Sprite
	t: number
	duration: number
	fromX: number
	fromY: number
	spin: number
	/** Caught fish stops above the angler's head instead of vanishing. */
	hold: boolean
	/** Full scale used for the jump and the held fish. */
	scale: number
}

/**
 * Gap between the angler's hat and the bottom edge of a landed catch, in scene
 * pixels.
 *
 * The catch is a small sprite inside a wide sunburst, so the edge that matters
 * is the bottom of the *light*, not the bottom of the fish: measured from the
 * sprite alone, the lower wedges came down over the hat and the burst read as
 * something the fisherman was wearing. It stays small on purpose — the group
 * hangs over the angler rather than floating away from him — but the burst has
 * to clear the hat by a few pixels at every rotation, which is what the number
 * buys.
 */
export const CATCH_CLEARANCE = 26

/** Deepest the float goes when something nibbles the bait, in scene pixels. */
export const NIBBLE_DIP = 2.6
/** How far the body slides down when the fish actually takes the bait. */
export const BITE_SINK = 12
/**
 * Radius of the fish-stamina stub under the float, in scene pixels. It sits
 * just outside the float's footprint and the ring the surface pushes out around
 * it, so the gauge is never lost inside the water ripples.
 */
export const STAMINA_ARC_RADIUS = 10

/**
 * How far under the surface the float is `nibbleTime` seconds before a nibble
 * ends: a fast jab down over the first third, then a slower rise back to rest.
 */
export function nibbleDip(nibbleTime: number): number {
	const progress = 1 - nibbleTime / TIMING.nibbleDuration
	const plunge =
		progress < 0.35 ? easeOutCubic(progress / 0.35) : 1 - easeOutCubic((progress - 0.35) / 0.65)
	return plunge * NIBBLE_DIP
}

/**
 * Poses from the 4×4 character sheet. Row 3 is the side view facing right,
 * row 2 the back view looking away from the camera; a water body picks the
 * set that points the rod at its water.
 */
export const ANGLER_POSES = {
	side: {
		idle: [12],
		/**
		 * The throw is two poses: the rod goes back over the shoulder (12) and
		 * snaps forward level with the water (13). The sheet also has a bent-rod
		 * whip and a raised follow-through between them, and playing all four made
		 * the cast read as a twitch of the rod rather than one throw — the end of
		 * the animation is also the waiting pose, so the arm lands where it stays.
		 */
		cast: [12, 13],
		wait: [13],
		pull: [14, 15],
		land: [15],
		/** Rod tip in scene pixels relative to the angler (frame 13: tip 31,18). */
		rodTip: { x: 15, y: -14 }
	},
	back: {
		idle: [8],
		cast: [8, 9],
		wait: [9],
		pull: [10, 11],
		land: [11],
		/** The back view holds the rod straight up (frame 9: tip 18,1). */
		rodTip: { x: 2, y: -30 }
	}
} as const

export type AnglerPose = (typeof ANGLER_POSES)[keyof typeof ANGLER_POSES]

/**
 * Shared fishing stage: angler, rod, line, bobber, particles and the catch
 * animation. The area-specific world is painted by a {@link SceneRenderer},
 * so every water body can look completely different without duplicating the
 * fishing mechanics.
 */
