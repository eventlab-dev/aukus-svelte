/**
 * Drops the renderer's pixel ratio when the device cannot keep up.
 *
 * The fight is a fill-rate problem, not a logic one: on a phone the same scene
 * ran at ~39 fps with a 2× backing store and at a flat 60 fps with a 1× one,
 * which means the pixels cost more than everything the frame does. So the game
 * starts at the sharpest cap it is allowed and steps *down* while the frame time
 * stays bad — never back up, because a resolution that climbs the moment the
 * player pauses gives an oscillation nobody can see the cause of.
 *
 * Stepping only on a whole window keeps a single slow frame from changing the
 * picture: the average over `WINDOW` seconds is what counts.
 */
const STEPS = [2, 1.75, 1.5, 1.25, 1] as const
/** Seconds of frames per measurement. */
const WINDOW = 2.5
/** Seconds ignored after construction: the boot screen is not the game. */
const WARMUP = 3
/**
 * Below this average the picture is too expensive.
 *
 * 48, not 52: a phone whose 1.5× frame lands at ~52 fps is holding a perfectly
 * smooth fight, and a threshold that close to it would drop it a step further
 * for nothing. The number is a floor for "bad", not a target for "good".
 */
const FLOOR_FPS = 48

export class RenderScale {
	private index = 0
	private elapsed = 0
	private frames = 0
	private warmup = WARMUP

	/**
	 * @param cap highest ratio the platform allows (device pixel ratio, capped).
	 * @param apply called with the new ratio; the caller resizes the renderer.
	 */
	constructor(
		private readonly cap: number,
		private readonly apply: (scale: number) => void
	) {
		// Start at the step at or below the platform's cap.
		this.index = Math.max(
			0,
			STEPS.findIndex((step) => step <= cap + 1e-6)
		)
		if (this.index < 0) this.index = STEPS.length - 1
	}

	/** Ratio the renderer should use right now. */
	get value(): number {
		return Math.min(STEPS[this.index], this.cap)
	}

	/** One rendered frame. */
	frame(dt: number): void {
		if (!(dt > 0)) return
		if (this.warmup > 0) {
			this.warmup -= dt
			return
		}
		this.elapsed += dt
		this.frames += 1
		if (this.elapsed < WINDOW) return
		const fps = this.frames / this.elapsed
		this.elapsed = 0
		this.frames = 0
		if (fps >= FLOOR_FPS) return
		const next = this.index + 1
		if (next >= STEPS.length) return
		// Never settle below 1: a quarter of the pixels of a 2× frame would be
		// visibly soft even to a player who does not look for it.
		if (STEPS[next] < 1) return
		this.index = next
		this.apply(this.value)
	}
}
