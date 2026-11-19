import { FIGHT } from '../../config'
import { FIGHT_RADIUS } from './constants'
import type { FightState } from './state'

/**
 * A missed strong dash deposits its share of the escape clock here instead of
 * pushing it in one step; {@link updateZone} pours it in over `missFillTime`.
 * The deposit is capped at a full meter, so overlapping misses cannot bank
 * more than one tear-off.
 */
export function depositMissShare(state: FightState, amount: number): void {
	const s = state
	s.escapeFill = Math.min(s.escapeHold, s.escapeFill + amount)
}

/**
 * Refund the escape clock. The pending fill is cancelled first: a counter that
 * lands right after a miss has to refund the miss it answers, not get clamped
 * by a clock that has barely started to climb.
 */
export function relieveEscape(state: FightState, amount: number): void {
	const s = state
	const fromFill = Math.min(s.escapeFill, amount)
	s.escapeFill -= fromFill
	s.outsideTimer = Math.max(0, s.outsideTimer - (amount - fromFill))
}

/** Advances the escape clock. Returns true when the fish tore free. */
export function updateZone(state: FightState, dt: number): boolean {
	const s = state

	// A missed dash pays in at a steady rate over `missFillTime`, so the float
	// sinks through the mistake instead of snapping to half of the meter.
	if (s.escapeFill > 0) {
		const rate = (FIGHT.uncounteredBurst * s.escapeHold) / FIGHT.missFillTime
		const pour = Math.min(s.escapeFill, rate * dt)
		s.escapeFill -= pour
		s.outsideTimer = Math.min(s.escapeHold, s.outsideTimer + pour)
	}

	// A missed dash can fill the meter while the fish is already back inside, so
	// the clock is checked before the inside recovery can refund it.
	if (s.outsideTimer >= s.escapeHold) return true

	const distance = Math.hypot(s.fishX, s.fishY)
	s.outside = distance > FIGHT_RADIUS

	if (distance > FIGHT_RADIUS) {
		// Reeling against the fish slows the escape clock to a crawl, but only
		// actually getting it back inside stops the clock. A passive player
		// therefore loses the fish, while an active one can recover.
		s.outsideTimer += dt * (s.steeringNow ? FIGHT.escapePullFactor : 1)
		if (s.outsideTimer >= s.escapeHold) return true
	} else {
		// Inside, the clock unwinds slowly. A missed dash locks the recovery for a
		// couple of seconds, so the meter cannot be healed away between two dashes;
		// a normal excursion still recovers, so a clean fight stays forgiving.
		if (s.escapeLock > 0) {
			s.escapeLock = Math.max(0, s.escapeLock - dt)
		} else {
			s.outsideTimer = Math.max(0, s.outsideTimer - dt * s.escapeHold * FIGHT.escapeRecover)
		}
	}
	return false
}
