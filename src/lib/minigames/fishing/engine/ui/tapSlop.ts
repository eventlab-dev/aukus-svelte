/**
 * How far a press may travel and still be a tap, in virtual pixels.
 *
 * A mouse click is a point: the pointer goes down and up in the same place.
 * A finger always rolls a little — a few pixels of travel are the hand, not a
 * gesture — so a button that fires on `pointertap` alone also fires at the end
 * of a drag that merely started on it. Six virtual pixels is roughly the
 * platform touch slop once the frame is scaled up on a phone.
 */
export const TAP_SLOP = 6

/**
 * Remembers where a press started and decides whether its release was a tap.
 *
 * The coordinates are the event's `global` ones (canvas pixels), not the
 * target's local ones: a drag that leaves a card and comes back moves in both
 * frames, and the canvas frame is the one that does not depend on the target.
 */
export class TapGuard {
	private startX = 0
	private startY = 0
	private armed = false

	/** Begins a gesture at a global point. */
	start(x: number, y: number): void {
		this.startX = x
		this.startY = y
		this.armed = true
	}

	/**
	 * Ends the gesture: true when it stayed inside `slop`. The guard disarms
	 * whatever the answer is, so one press can never count twice.
	 */
	end(x: number, y: number, slop = TAP_SLOP): boolean {
		if (!this.armed) return false
		this.armed = false
		return Math.hypot(x - this.startX, y - this.startY) <= slop
	}

	/** Drops the gesture, for a target that lost the press. */
	cancel(): void {
		this.armed = false
	}
}
