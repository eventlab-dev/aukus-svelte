import { angleDelta } from '../../game/fight/angles'
import { STICK_GRAB_SLACK, zoneArc } from '../../game/fight/zoneTuning'

/**
 * The counter gesture, as a stick reads it.
 *
 * On a mouse the counter is a hand movement: press inside the dash sector and
 * drag toward the middle of the ring. A thumb on a stick cannot "press inside"
 * anything — the stick is already held — so the same movement becomes "point
 * the stick at the dash, then pull it back toward the middle of the pad". Both
 * halves have to stay inside the sector, and a fresh push is needed for the
 * next one.
 *
 * It lives here, apart from the drawing, because it is the part that decides a
 * fight: the control owns the pixels, this owns the rule.
 */

/** Deflection that arms the grab: the stick points into the sector this far. */
export const GRAB_ARM = 0.6
/**
 * Deflection the pull has to come back to. Arm at 0.6 and fire at 0.26, so the
 * thumb travels ~15 px — the pad's share of the 9 px the mouse needs.
 */
export const GRAB_PULL = 0.26

export class GrabGesture {
	private armed = false

	/** Drops an unfinished gesture, e.g. when the stick is let go or the sector ends. */
	reset(): void {
		this.armed = false
	}

	/**
	 * One stick sample. Returns true on the sample that completes the grab — the
	 * caller turns that into one counter attempt.
	 */
	update(magnitude: number, angle: number, cue: number | null): boolean {
		if (cue === null) {
			this.armed = false
			return false
		}
		if (Math.abs(angleDelta(angle, cue)) > zoneArc() + STICK_GRAB_SLACK) {
			this.armed = false
			return false
		}
		if (magnitude >= GRAB_ARM) {
			this.armed = true
			return false
		}
		if (this.armed && magnitude <= GRAB_PULL) {
			this.armed = false
			return true
		}
		return false
	}
}
