/** Fixed slice of fight simulation, in seconds. */
const STEP = 1 / 60
/**
 * Most real time one frame may simulate. At 10 fps a frame is exactly six
 * steps, so the fight keeps real time; below that it slows down instead of
 * letting one delta jump the telegraph and the counter window.
 */
const MAX_CATCHUP = 0.1

/**
 * Turns frame deltas into fixed simulation steps.
 *
 * The fight is a timing game: its telegraph (0.5 s), counter window (0.2 s)
 * and landing cue all live on the simulation clock. Feeding a clamped frame
 * delta straight to the integrator made a slow frame stretch those windows in
 * wall-clock time, so a throttled CPU became an easier fight. A fixed step
 * keeps every window the same length at any frame rate, and at 60 fps it is
 * exactly one tick per frame, which keeps the headless oracle unchanged.
 */
export class FightPace {
	/** Real time not simulated yet, carried between frames. */
	private remainder = 0

	/** Run `tick` for every whole step contained in `dt`. */
	advance(dt: number, tick: (step: number) => void): void {
		this.remainder = Math.min(this.remainder + dt, MAX_CATCHUP)
		let steps = Math.floor((this.remainder + 1e-9) / STEP)
		while (steps > 0) {
			this.remainder -= STEP
			steps -= 1
			tick(STEP)
		}
		if (this.remainder < 0) this.remainder = 0
	}
}
