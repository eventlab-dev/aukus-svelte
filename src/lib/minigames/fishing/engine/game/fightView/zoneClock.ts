import { mixColor } from '../../world'
import { COUNTER_TONE } from './setup'
import { zoneTuning } from '../fight/zoneTuning'

/**
 * The life of one zone: when it appeared, how long it stays, how far it has faded
 * in and out, and how far it has drained to the blocked grey.
 *
 * One instance per zone; the view keeps two (the truth and the false side of a
 * feint), the panel's preview keeps the same pair. Nothing here knows about the
 * fight — the caller says "live", "blocked" and how long the paint lasts.
 */
export class ZoneClock {
	/** 0..1 how far the zone has drained to the blocked grey. */
	grey = 0
	private age = 0
	/** 1 while the zone holds, then falls to 0 over `fadeOut` seconds. */
	private gone = 1
	private input = false

	/** 0..1 opacity of the zone: faded in from nothing, then faded out. */
	alpha(): number {
		const grown = Math.min(1, this.age / Math.max(0.001, zoneTuning.fadeIn))
		return grown * this.gone
	}

	/** The zone's colour, drained towards the blocked tone by `grey`. */
	tone(base: number): number {
		return mixColor(base, COUNTER_TONE, this.grey)
	}

	/**
	 * Advance the clock by `dt` seconds.
	 *
	 * `live` starts a fresh zone on its rising edge; `limit` is how long that zone
	 * is painted, and the fade-out begins when it runs out — the window the player
	 * presses through and the paint they see are the same span. `blocked` is a
	 * caught counter: the zone holds while the padlock is up and drains to grey.
	 */
	update(dt: number, live: boolean, blocked = false, limit = Number.POSITIVE_INFINITY): void {
		if (live && !this.input) {
			this.age = 0
			this.gone = 1
			this.grey = 0
		}
		this.input = live
		const showing = live && this.age < limit
		if (showing) {
			this.age += dt
		} else if (!blocked && this.gone > 0) {
			this.gone = Math.max(0, this.gone - dt / Math.max(0.001, zoneTuning.fadeOut))
		}
		if (blocked) {
			this.grey = Math.min(1, this.grey + dt / Math.max(0.001, zoneTuning.greyTime))
		}
	}

	/** Back to a zone that has never appeared, e.g. when the preview changes beat. */
	reset(): void {
		this.input = false
		this.age = 0
		this.gone = 1
		this.grey = 0
	}
}
