import { Container, Graphics } from 'pixi.js'
import { VIEW } from '../config'
import { clamp, easeOutCubic } from '../utils'
import { UI } from './palette'

/**
 * Pixel grid wipe over the whole frame, used when the player changes place.
 *
 * The flat dip to ink is still what navigation inside the interface uses; this
 * one is for a new water body and for the picker handing over to a round, where
 * the change is spatial and deserves a direction. The wave of ink cells starts
 * in the cell under the button that asked for the change, so a click in a
 * corner travel card visibly pulls the new lake in from that corner — and the
 * cells that are already ink keep their own hard edges as the wave passes, which
 * is what makes it read as a grid rather than as one solid edge sweeping over
 * the frame.
 *
 * Cover and reveal use the same per-cell delays in the same order: the ink
 * rolls over the old scene and then peels back off the new one, which reads as
 * one wipe passing through rather than as a cross-fade.
 */
const CELL = 24
const COLS = Math.ceil(VIEW.width / CELL)
const ROWS = Math.ceil(VIEW.height / CELL)
/** How long a single cell takes to turn from clear to ink. */
const CELL_TIME = 0.075
/** Extra time the wave front needs to cross the whole frame. */
const SPREAD = 0.24
const COVER_TIME = CELL_TIME + SPREAD
const REVEAL_TIME = 0.2 + CELL_TIME

export interface WipePoint {
	x: number
	y: number
}

export class GridWipe extends Container {
	/** Every cell is one `fill` call, so the wipe keeps a single draw batch. */
	private readonly ink = new Graphics()
	/** Per-cell start of the wave, in seconds from the beginning of the wipe. */
	private delays: number[] = new Array(COLS * ROWS).fill(0)
	private mode: 'clear' | 'covering' | 'ink' | 'revealing' = 'clear'
	private elapsed = 0

	constructor() {
		super()
		this.eventMode = 'none'
		this.ink.eventMode = 'none'
		this.addChild(this.ink)
		this.visible = false
	}

	/** Starts covering the frame; the wave begins under `origin`. */
	beginCover(origin: WipePoint, inward = false): void {
		this.buildDelays(origin, inward)
		this.mode = 'covering'
		this.elapsed = 0
		this.visible = true
		this.draw()
	}

	/** Drops the overlay at once, for a transition that does not use it. */
	hide(): void {
		this.mode = 'clear'
		this.elapsed = 0
		this.ink.clear()
		this.visible = false
	}

	/** Peels the ink back off, wave starting in the same cell that covered it. */
	beginReveal(): void {
		this.mode = 'revealing'
		this.elapsed = 0
		this.visible = true
		this.draw()
	}

	/**
	 * Advances the wave. Returns true on the frame the current half of the
	 * transition finished, so the manager can swap screens at full ink.
	 */
	step(dt: number): boolean {
		if (this.mode === 'clear' || this.mode === 'ink') return true
		const total = this.mode === 'covering' ? COVER_TIME : REVEAL_TIME
		this.elapsed += dt
		const finished = this.elapsed >= total
		this.elapsed = Math.min(this.elapsed, total)
		this.draw()
		if (finished) {
			this.mode = this.mode === 'covering' ? 'ink' : 'clear'
			if (this.mode === 'clear') this.visible = false
		}
		return finished
	}

	/**
	 * Wave starts in the cell under `origin` and spreads to the far corners.
	 *
	 * With `inward` the profile is mirrored: the cells farthest from `origin`
	 * turn first and the origin is the last one to go dark, so the ink closes onto
	 * the point instead of running away from it. Cover and reveal share the same
	 * delays, so an inward wipe also peels back toward its origin — the whole
	 * transition converges on the cell the player's action came from. That is what
	 * leaving a round uses: going in is a wave spreading from where the button
	 * was, coming out is the same wave running backwards.
	 */
	private buildDelays(origin: WipePoint, inward: boolean): void {
		const ox = clamp(origin.x / CELL, 0, COLS)
		const oy = clamp(origin.y / CELL, 0, ROWS)
		const reach = Math.hypot(Math.max(ox, COLS - ox), Math.max(oy, ROWS - oy))
		for (let row = 0; row < ROWS; row += 1) {
			for (let col = 0; col < COLS; col += 1) {
				const dx = col + 0.5 - ox
				const dy = row + 0.5 - oy
				// A round wave, always: the ink spreads cell by cell from the click, so
				// the wipe reads as a grid instead of as one solid edge crossing the
				// frame. A flat wall (delay by column only) is what this replaced.
				const distance = reach > 0 ? Math.hypot(dx, dy) / reach : 0
				const delay = distance * SPREAD
				this.delays[row * COLS + col] = inward ? SPREAD - delay : delay
			}
		}
	}

	private draw(): void {
		const g = this.ink
		g.clear()
		if (this.mode === 'clear') return
		const revealing = this.mode === 'revealing'
		for (let row = 0; row < ROWS; row += 1) {
			for (let col = 0; col < COLS; col += 1) {
				const delay = this.delays[row * COLS + col]
				const local = clamp((this.elapsed - delay) / CELL_TIME)
				const alpha = easeOutCubic(revealing ? 1 - local : local)
				if (alpha <= 0) continue
				g.rect(col * CELL, row * CELL, CELL, CELL).fill({
					color: UI.ink,
					alpha
				})
			}
		}
	}
}
