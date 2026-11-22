import type { FightState } from './state'

/**
 * The player's three controls — hold, aim, steer — as mutations of the state.
 *
 * They live beside {@link pullVector} instead of on the model because they are
 * input: the model owns the tick order and the rules, while these only record
 * what the hands are doing. The press point is the one that matters most: the
 * counter is a gesture, so where the button went down has to be stored with the
 * press and kept until the next one.
 */

/** Hold to pull; release to rest. */
export function applyHold(state: FightState, held: boolean): void {
	// Only a real press sets the edge: the round repeats `setHold(true)` on every
	// frame the button stays down, and that must not spend it.
	if (held && !state.hold) {
		state.freshPress = true
		// The press is where a counter starts: the gesture has to know whether the
		// player grabbed the arrow or just pulled from wherever the cursor was.
		state.pressX = state.pointerX
		state.pressY = state.pointerY
	}
	state.hold = held
	if (!held) {
		state.stickyX = 0
		state.stickyY = 0
	}
}

/** Cursor position in screen space; while held it sets the pull direction. */
export function applyPointer(state: FightState, x: number | null, y: number | null): void {
	state.pointerX = x
	state.pointerY = y
}

/** Optional keyboard steering direction (normalized by the caller). */
export function applyDirection(state: FightState, x: number, y: number): void {
	state.directionX = x
	state.directionY = y
}

/**
 * Resolves the pull direction for this frame: keyboard overrides the pointer,
 * then the cursor relative to the fish, then the last sticky direction, then
 * straight back toward the ring centre.
 */
export function pullVector(state: FightState): { x: number; y: number } | null {
	const s = state
	if (!s.hold) return null
	const dirLength = Math.hypot(s.directionX, s.directionY)
	if (dirLength > 0.1) {
		return {
			x: s.directionX / dirLength,
			y: s.directionY / dirLength
		}
	}

	const fishX = s.centerX + s.fishX
	const fishY = s.centerY + s.fishY
	if (s.pointerX !== null && s.pointerY !== null) {
		const dx = s.pointerX - fishX
		const dy = s.pointerY - fishY
		const length = Math.hypot(dx, dy)
		if (length > 10) {
			s.stickyX = dx / length
			s.stickyY = dy / length
			return { x: s.stickyX, y: s.stickyY }
		}
	}

	// Keep pulling in the last valid direction when the cursor sits on the
	// fish itself, so the catch never slips out from under the pointer. With
	// no recorded aim yet, pull straight back toward the ring centre.
	if (s.stickyX !== 0 || s.stickyY !== 0) {
		return { x: s.stickyX, y: s.stickyY }
	}
	const radius = Math.hypot(s.fishX, s.fishY)
	if (radius > 1) {
		return { x: -s.fishX / radius, y: -s.fishY / radius }
	}
	return null
}
