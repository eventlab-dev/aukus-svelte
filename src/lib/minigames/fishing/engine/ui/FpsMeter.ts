import { Container, Graphics, Text } from 'pixi.js'
import { UI } from './palette'
import { makeText } from './theme'

/**
 * Frame-rate readout for a phone in the hand, asked for with `?fps=1`.
 *
 * A phone has no devtools — on iOS there is no remote inspector from Windows at
 * all — so the only way to answer "is the fight stuttering?" is to print the
 * number on the frame itself. It is opt-in and costs one short string per half
 * second, so it can stay in the shipped build: without the parameter nothing is
 * created.
 *
 * It lives in screen space, not in the letterboxed world: the size has to be
 * readable at arm's length, and it must not be scaled by the frame fit.
 */
const WINDOW = 0.5

export class FpsMeter extends Container {
	private readonly backdrop = new Graphics()
	private readonly readout: Text
	private elapsed = 0
	private frames = 0
	private slowest = 0

	/** @param scale current renderer pixel ratio, printed next to the frame time. */
	constructor(private readonly ratio: () => number) {
		super()
		this.eventMode = 'none'
		this.interactiveChildren = false

		this.backdrop
			.rect(0, 0, 210, 20)
			.fill({ color: UI.ink, alpha: 0.72 })
			.rect(0, 0, 210, 1)
			.fill({ color: UI.periwinkle, alpha: 0.5 })
		this.addChild(this.backdrop)

		this.readout = makeText('0 FPS', {
			size: 11,
			weight: 700,
			color: UI.text
		})
		this.readout.position.set(6, 3)
		this.addChild(this.readout)

		this.position.set(8, 8)
	}

	/** True when the page asked for the meter: `?fps=1`. */
	static requested(): boolean {
		if (typeof window === 'undefined') return false
		return new URLSearchParams(window.location.search).get('fps') === '1'
	}

	/** One ticker frame. Reports the average over the window and its worst frame. */
	frame(dt: number): void {
		if (!(dt > 0)) return
		this.elapsed += dt
		this.frames += 1
		this.slowest = Math.max(this.slowest, dt)
		if (this.elapsed < WINDOW) return
		const fps = this.frames / this.elapsed
		const ms = (this.elapsed / this.frames) * 1000
		const worst = this.slowest * 1000
		const ratio = this.ratio()
			.toFixed(2)
			.replace(/\.?0+$/, '')
		this.readout.text = `${fps.toFixed(0)} FPS  ${ms.toFixed(1)} / ${worst.toFixed(0)} ms  @${ratio}x`
		this.elapsed = 0
		this.frames = 0
		this.slowest = 0
	}
}
