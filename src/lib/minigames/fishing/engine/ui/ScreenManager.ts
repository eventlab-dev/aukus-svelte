import { Container, Graphics } from 'pixi.js'
import { VIEW } from '../config'
import { clamp, easeOutCubic } from '../utils'
import { UI } from './palette'
import { GridWipe, type WipePoint } from './GridWipe'
import type { Screen } from './Screen'

/**
 * How the next screen change is dressed.
 *
 * - `fade` — the original short dip to ink; used when a round ends and the menu
 *   comes back, where there is no spatial relationship to animate.
 * - `wipe` — the pixel grid wave, reserved for a change of place: another water
 *   body, or the picker handing over to a round. The wave spreads out of
 *   `origin`.
 * - `wipeIn` — the same grid wave running backwards: the ink closes onto
 *   `origin` instead of leaving it. Used when the player leaves a round, so
 *   going out is the exact reverse of going in.
 * - `flyIn` / `flyOut` — the popup slide: the new panel rises from the bottom
 *   edge, or the current panel drops away to reveal the one underneath. No
 *   full-screen flash, exactly like Svelte's `transition:fly`.
 */
export type ScreenTransition = 'fade' | 'wipe' | 'wipeIn' | 'flyIn' | 'flyOut'

/** Where the wave starts when the change did not come from a pointer. */
const CENTRE: WipePoint = { x: VIEW.width / 2, y: VIEW.height / 2 }
/** How long a popup takes to slide in or out. */
export const FLY_TIME = 0.28
/** Vertical travel of the popup slide, in pixels. */
const FLY_LIFT = 22

/**
 * Holds a single screen at a time and swaps them behind a transition: a plain
 * dip to ink, a pixel grid wipe for a change of place, or a vertical fly for
 * the panels that open over another screen.
 */
export class ScreenManager {
	readonly layer = new Container()
	private readonly fade = new Graphics()
	private readonly wipe = new GridWipe()
	private current: Screen | null = null
	private pending: Screen | null = null
	private phase: 'idle' | 'out' | 'in' | 'fly' = 'idle'
	private style: ScreenTransition = 'fade'
	private progress = 0
	/** The screen the active fly is covering or revealing. */
	private leaving: Screen | null = null
	private flyT = 0
	/**
	 * Decoration that outlives the screens: it sits above whichever screen is
	 * showing and below the transitions, so the ice stays put across a swap.
	 */
	private veil: Container | null = null

	constructor() {
		this.fade.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.ink })
		this.fade.alpha = 0
		this.fade.eventMode = 'none'
		this.layer.addChild(this.fade, this.wipe)
	}

	get active(): Screen | null {
		return this.current
	}

	show(screen: Screen, transition: ScreenTransition = 'fade', origin: WipePoint = CENTRE): void {
		if (this.phase === 'fly') this.settleFly()
		if (this.current === null) {
			this.setCurrent(screen)
			this.phase = 'in'
			// The first screen always rises out of the flat ink: there is no previous
			// place to fly away from.
			this.style = 'fade'
			this.progress = 0
			this.wipe.hide()
			this.fade.alpha = 1
			return
		}
		if (this.pending && this.pending !== screen) {
			this.pending.destroy({ children: true })
		}
		if (transition === 'flyIn' || transition === 'flyOut') {
			this.pending = null
			this.beginFly(screen, transition)
			return
		}
		this.pending = screen
		this.phase = 'out'
		this.progress = 0
		this.style = transition === 'wipeIn' ? 'wipe' : transition
		if (transition === 'wipe' || transition === 'wipeIn') {
			this.fade.alpha = 0
			this.wipe.beginCover(origin, transition === 'wipeIn')
		} else {
			this.wipe.hide()
		}
	}

	/**
	 * Starts the popup slide. `flyIn` puts the new screen above the old one and
	 * lifts it from below; `flyOut` puts it underneath and drops the old one off
	 * the bottom edge, so going back reveals the screen it came from.
	 */
	private beginFly(screen: Screen, transition: 'flyIn' | 'flyOut'): void {
		this.style = transition
		this.phase = 'fly'
		this.flyT = 0
		this.leaving = this.current
		if (this.leaving) this.leaving.eventMode = 'none'
		if (transition === 'flyIn') {
			this.setCurrent(screen)
			if (screen.selfFlown) {
				// The panel animates itself over a dimmer that must stay put.
				screen.y = 0
				screen.alpha = 1
				return
			}
			screen.y = FLY_LIFT
			screen.alpha = 0
			return
		}
		const index = this.leaving ? this.layer.getChildIndex(this.leaving) : 0
		this.current = screen
		this.layer.addChildAt(screen, index)
		screen.onEnter()
	}

	/** Drops the screen a finished fly was covering or revealing. */
	private settleFly(): void {
		const leaving = this.leaving
		this.leaving = null
		this.flyT = 1
		this.phase = 'idle'
		if (leaving) {
			leaving.onExit()
			this.layer.removeChild(leaving)
			leaving.destroy({ children: true })
		}
	}

	private setCurrent(screen: Screen): void {
		this.current = screen
		this.layer.addChildAt(screen, this.screenIndex())
		screen.onEnter()
	}

	/** Screens stack under the veil, which stacks under the two transitions. */
	private screenIndex(): number {
		return this.veil ? this.layer.getChildIndex(this.veil) : this.layer.getChildIndex(this.fade)
	}

	/** Installs (or replaces) the decorative layer shared by every screen. */
	setVeil(veil: Container | null): void {
		if (this.veil === veil) return
		if (this.veil) {
			this.layer.removeChild(this.veil)
			this.veil.destroy({ children: true })
		}
		this.veil = veil
		// Under the transitions, so the frost dips to ink with the screen instead
		// of staying bright over a black frame.
		if (veil) this.layer.addChildAt(veil, this.layer.getChildIndex(this.fade))
	}

	private swap(): void {
		if (!this.pending) return
		const next = this.pending
		this.pending = null
		if (this.current) {
			const old = this.current
			old.onExit()
			this.layer.removeChild(old)
			old.destroy({ children: true })
		}
		this.setCurrent(next)
		this.phase = 'in'
		this.progress = 0
	}

	update(dt: number): void {
		if (this.phase === 'fly') {
			this.flyT = clamp(this.flyT + dt / FLY_TIME)
			const eased = easeOutCubic(this.flyT)
			if (this.style === 'flyIn') {
				// The popup rises a short way and fades in; it does not slide the whole
				// frame, which is what made it read as another screen instead of a
				// dialog over the one the player is already looking at. A screen that
				// flies itself (`selfFlown`) is left exactly where it is.
				if (this.current && !this.current.selfFlown) {
					this.current.y = FLY_LIFT * (1 - eased)
					this.current.alpha = Math.min(1, eased * 1.4)
				}
			} else if (this.leaving) {
				// Going back drops the popup off the bottom edge instead of
				// cross-fading two detailed screens into each other: the one underneath
				// is revealed from the top as the panel slides away. A screen that
				// animates its own chrome drops only its panel — the whole screen used
				// to slide, dimmer included, which read as a dark sheet being dragged
				// off the frame.
				if (this.leaving.animateOut) this.leaving.animateOut(dt)
				else this.leaving.y = VIEW.height * eased
			}
			if (this.flyT >= 1) {
				if (this.current) {
					this.current.y = 0
					this.current.alpha = 1
				}
				this.settleFly()
			}
		} else if (this.phase === 'out') {
			if (this.style === 'wipe') {
				// Swap on the frame the ink is complete: the old screen is never seen
				// half-covered by the new one.
				if (this.wipe.step(dt)) {
					this.swap()
					this.wipe.beginReveal()
				}
			} else {
				this.progress += dt / 0.13
				this.fade.alpha = Math.min(1, this.progress)
				if (this.progress >= 1) this.swap()
			}
		} else if (this.phase === 'in') {
			if (this.style === 'wipe') {
				if (this.wipe.step(dt)) this.phase = 'idle'
			} else {
				this.progress += dt / 0.17
				this.fade.alpha = 1 - Math.min(1, this.progress)
				if (this.progress >= 1) {
					this.phase = 'idle'
					this.fade.alpha = 0
				}
			}
		}
		this.current?.update(dt)
	}

	handleKey(event: KeyboardEvent): void {
		this.current?.handleKey(event)
	}

	handleKeyUp(event: KeyboardEvent): void {
		this.current?.handleKeyUp(event)
	}

	onHostPause(paused: boolean): void {
		this.current?.onHostPause(paused)
	}

	destroy(): void {
		if (this.pending) {
			this.pending.destroy({ children: true })
			this.pending = null
		}
		if (this.leaving) {
			this.leaving.destroy({ children: true })
			this.leaving = null
		}
		this.current = null
		this.layer.parent?.removeChild(this.layer)
		this.layer.destroy({ children: true })
	}
}
