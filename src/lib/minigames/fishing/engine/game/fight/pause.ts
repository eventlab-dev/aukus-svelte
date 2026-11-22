import type { FightCounter } from './counter'
import type { FightMotion } from './motion'
import type { FightState } from './state'
import { zoneTuning } from './zoneTuning'

/**
 * Resolve the dash that was live when the round stopped.
 *
 * The fight freezes as a whole, so without this a player could stop the clock on
 * any telegraph, study it for as long as they liked, and come back to the same
 * counter window. A reaction window must not be banked through a menu: the dash
 * the player paused on resolves now, along its true heading, and its counter
 * window is already spent. A pause during the calm part of the fight costs
 * nothing, and the landing window is not touched — the final pull is a single
 * deliberate button, not a timed window.
 *
 * `recharge` is the one exception, and it is not a menu: a lesson of the manual
 * stops the fight to teach the dash it is standing on. A telegraph frozen there
 * resolves as usual, but the window it opens is not charged as a miss, and a
 * window that was already open when the note appeared is opened again for its
 * whole `truthTime` — the player reads the rule and answers the very dash it is
 * about. Without this, closing the note cost the escape bar a whole miss, which
 * read as the game punishing the player for reading.
 */
export function resumeFightAfterPause(
	state: FightState,
	motion: FightMotion,
	counter: FightCounter,
	recharge = false
): void {
	if (!state.running) return
	if (state.warnTime > 0) {
		if (motion.resolveTelegraph()) {
			counter.openWindow(zoneTuning.truthTime)
		} else {
			// A paused feint resolves fully: the false lunge and then the turn.
			motion.resolveFeintTurn()
			counter.openWindow(zoneTuning.truthTime)
		}
	} else if (state.feintTimer > 0) {
		motion.resolveFeintTurn()
		counter.openWindow(zoneTuning.truthTime)
	}
	if (recharge) {
		// The zone was already painted when the note stopped the round, and the
		// note has been holding whatever was left of its window. Hand the whole
		// window back, or the half-spent one resumes under the closing card.
		if (state.counterWindow > 0 && !state.counterUsed) {
			counter.openWindow(zoneTuning.truthTime)
		}
		return
	}
	counter.consumeUnanswered()
}
