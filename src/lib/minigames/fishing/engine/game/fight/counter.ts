import { FIGHT } from '../../config'
import { angleDelta } from './angles'
import type { FightState } from './state'
import { zoneArc, zoneInner, zoneOuter, zoneTuning, STICK_GRAB_SLACK } from './zoneTuning'
import { depositMissShare, relieveEscape } from './zone'

/**
 * Is `(x, y)` inside the grab wedge centred on `heading`?
 *
 * The wedge is the band the whole counter is built on: the press is a direction,
 * not a pixel — the player reads "the fish will bolt that way" and puts the
 * button down on that side, then pulls to the middle of the ring. Its half-angle
 * and its depth are the panel's (`zoneTuning`), and the view draws the very same
 * band, so the spot the player sees and the spot the model accepts cannot
 * disagree.
 *
 * It is deliberately a band, not the whole side of the water: the press has to
 * be aimed at the dash, so the float and the open middle stay out of it.
 */
export function inGrabWedge(state: FightState, x: number, y: number, heading: number): boolean {
	const dx = x - state.centerX
	const dy = y - state.centerY
	const radius = Math.hypot(dx, dy)
	if (radius < zoneInner() || radius > zoneOuter()) return false
	return Math.abs(angleDelta(Math.atan2(dy, dx), heading)) <= zoneArc()
}

/** Where the button went down: inside the wedge of the dash? */
function pressInWedge(state: FightState, heading: number): boolean {
	if (state.pressX === null || state.pressY === null) return false
	return inGrabWedge(state, state.pressX, state.pressY, heading)
}

/**
 * Is this press-and-drag the counter gesture?
 *
 * The counter used to be an aim: hold the line and point the pull against the
 * dash, and the burst was cancelled if the angle was close enough. That made
 * every dash the same reflex — pull the other way — and it fought with the aim
 * the player was already using to drag the fish back into the ring, so a
 * perfectly normal pull could spend the counter without meaning to.
 *
 * Now the move is physical: the press has to land on the dash side of the
 * ring, and the drag has to travel toward the middle of the ring. The same
 * gesture as a finger pinning the burst by its tail. Aim still matters for
 * everything else; the counter is its own beat.
 */
export function counterGesture(state: FightState): boolean {
	const s = state
	if (s.pointerX === null || s.pointerY === null) return false
	if (!pressInWedge(s, s.counterAngle)) return false

	const dragX = s.pointerX - s.pressX!
	const dragY = s.pointerY - s.pressY!
	const drag = Math.hypot(dragX, dragY)
	if (drag < zoneTuning.counterDrag) return false

	// Toward the middle: the drag has to point at the ring's centre, within a
	// generous cone. A drag that circles the ring is not a pull on the line.
	const toCentreX = s.centerX - s.pressX!
	const toCentreY = s.centerY - s.pressY!
	const reach = Math.hypot(toCentreX, toCentreY)
	if (reach <= 0) return false
	const inward = (dragX * toCentreX + dragY * toCentreY) / (drag * reach)
	return inward >= Math.cos(Math.PI / 3)
}

/** The short window in which the gesture cancels a dash. */
export class FightCounter {
	constructor(private readonly state: FightState) {}

	/**
	 * Open the grab for this dash.
	 *
	 * `delay` is how long the real zone waits before it appears (a feint hides
	 * behind its lie first), `window` how long it then stays on screen. The window
	 * *is* the zone's lifetime: a press inside the band counts while the band is
	 * painted, and the miss is charged when the paint ends.
	 */
	openWindow(window: number, delay = 0): void {
		const s = this.state
		s.counterWindow = 0
		s.counterDelay = delay
		s.counterSpan = window
		s.counterAngle = s.escapeAngle
		// Resting through the telegraph is one way in; the other is a press prepared
		// on the dash side, which `notePress` latched.
		s.counterArmed = s.warnRest >= zoneTuning.counterRest
		s.preBurstAngle = s.lastSteerAngle
		s.counterUsed = false
		s.counterPending = delay <= 0
		if (delay <= 0) s.counterWindow = window
	}

	/**
	 * A new press just went down. If a dash was already live, the grab is
	 * prepared: the player pressed on the warning, not a moment after the burst.
	 * Otherwise the press belongs to ordinary pulling and arms nothing.
	 */
	notePress(): void {
		const s = this.state
		s.counterPrepared = s.warnTime > 0 || s.feintTimer > 0 || s.counterWindow > 0
	}

	/**
	 * Close the window as unanswered. The round uses this when a pause froze a
	 * live dash: the player got a longer look, so the dash still costs what a
	 * missed counter costs instead of waiting harmlessly in the pause.
	 */
	consumeUnanswered(): void {
		const s = this.state
		const armed = s.counterPending || s.counterDelay > 0
		if (s.counterUsed || !armed) return
		s.counterPending = false
		s.counterDelay = 0
		s.counterWindow = 0
		s.counterUsed = true
		s.escapeLock = FIGHT.escapeLockTime
		depositMissShare(s, FIGHT.uncounteredBurst * s.escapeHold)
	}

	/**
	 * `held` is the button, not the pull: the grab is a hand movement on the rod,
	 * so the gesture is read from the pointer and not from the reel.
	 *
	 * A spent grip is the exception. The lockout takes the counter with the line
	 * and the last pull: no strength, no grab. The grip gauge wears a padlock for
	 * exactly that window, so the refusal is something the player can see.
	 */
	update(step: number, held: boolean): void {
		const s = this.state
		if (s.counterDelay > 0) {
			s.counterDelay = Math.max(0, s.counterDelay - step)
			if (s.counterDelay === 0) {
				s.counterWindow = s.counterSpan
				s.counterPending = true
			}
		}
		if (s.counterPending) {
			s.counterWindow = Math.max(0, s.counterWindow - step)
			if (s.counterWindow <= 0) {
				s.counterPending = false
				s.counterUsed = true
				// A strong dash that was not answered pushes the fish closer to
				// tearing free; holding the button alone does not count as an answer.
				s.escapeLock = FIGHT.escapeLockTime
				depositMissShare(s, FIGHT.uncounteredBurst * s.escapeHold)
			} else if (s.warnRest >= zoneTuning.counterRest) {
				// The window now covers the telegraph, so a player who rested into it
				// arms the grab as the rest accumulates, not only on the frame it opens.
				s.counterArmed = true
			}
		}
		if (s.counterWindow <= 0 || s.counterUsed || !held) return
		// No grip, no grab: the window still burns down (and charges its miss), but
		// the hand on the rod cannot answer.
		if (s.gripLock > 0 || s.grip <= 0) return
		// The burst is still ablaze: its heading can be read on the same frame the
		// gesture lands, so the arrow and the grab cannot disagree.
		s.counterAngle = s.escapeAngle
		// A stick flick is one event: it is read here and dropped whatever comes of
		// it, so a flick thrown at a closed window cannot answer the next dash.
		const flick = s.stickGrabAngle
		s.stickGrabAngle = null
		const flicked =
			flick !== null && Math.abs(angleDelta(flick, s.escapeAngle)) <= zoneArc() + STICK_GRAB_SLACK
		if (!flicked) {
			if (!counterGesture(s)) return
			// A grab that skips the rest is still a deliberate press: either it landed
			// on the live dash (`counterPrepared`) or it is this very frame's edge. The
			// gate only keeps a pull that was already running from turning into a
			// counter by drag.
			if (!s.counterArmed && !s.counterPrepared && !s.freshPress) return
		}

		s.counterUsed = true
		s.counterPending = false
		s.counterWindow = 0
		// The counter pays back most of a miss, pending fill included.
		relieveEscape(s, FIGHT.counterRelief * s.escapeHold)
		s.advantage = FIGHT.advantage
		// The lock cue lasts exactly as long as the stun: while it is on screen the
		// fish hangs still, so the player never sees a padlock on a fish that is
		// already jerking away again.
		s.counterFlash = zoneTuning.counterStun
		s.vx = 0
		s.vy = 0
		if (s.current) s.moveTime = s.current.dur
		s.stun = zoneTuning.counterStun
		s.onCounter?.()
	}
}
