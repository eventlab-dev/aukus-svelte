import { Container, Graphics, Rectangle } from 'pixi.js'
import type { GameContext } from '../GameContext'
import type { AreaId } from '../types'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { easeOutCubic } from '../utils'
import { FLY_TIME } from './ScreenManager'
import { CodexView } from './CodexView'
import { UI } from './palette'

/** How far the codex rises while it flies in, in pixels. */
export const CODEX_FLY_LIFT = 26
/** How long that rise takes, in seconds. */
export const CODEX_FLY_TIME = 0.34
/** The dimmer fades in under the arriving panel over this time. */
export const CODEX_SCRIM_TIME = 0.24
/**
 * How long the panel takes to drop out of the frame when the codex closes, in
 * seconds. It matches the screen manager's popup fly, so the menu path (which
 * the manager drops on its own clock) closes exactly like the pause path.
 */
export const CODEX_FLY_OUT_TIME = FLY_TIME

/**
 * Modal codex layer for a paused round. The blocker dims the frozen game and
 * swallows input so only the codex receives clicks while it is open. The dimmer
 * stays put; only the panel rises into place, so the codex reads as a dialog
 * over the water rather than as a screen sliding in. Closing runs the same
 * motion backwards: the panel drops away and the dimmer fades where it is.
 */
export class CodexOverlay extends Container {
	private readonly view: CodexView
	private readonly blocker = new Graphics()
	private intro = 0
	private closing = false
	private outro = 0

	constructor(game: GameContext, areaId: AreaId, onClose: () => void) {
		super()

		this.blocker.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.scrim, alpha: 0.72 })
		this.blocker.eventMode = 'static'
		this.blocker.cursor = CURSORS.default
		this.blocker.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
		this.blocker.alpha = 0
		this.addChild(this.blocker)

		this.view = new CodexView(game, areaId, onClose)
		this.view.y = CODEX_FLY_LIFT
		this.view.alpha = 0
		this.addChild(this.view)
	}

	/** True while the panel is already on its way out. */
	get isClosing(): boolean {
		return this.closing
	}

	/**
	 * Starts the fly-out. The screen keeps ticking the overlay and drops it when
	 * {@link update} reports the animation is done.
	 */
	beginClose(): void {
		if (this.closing) return
		this.closing = true
		this.outro = 0
		// An exiting panel must not take a click or a key for the round behind it.
		this.view.interactiveChildren = false
		this.blocker.eventMode = 'none'
	}

	/**
	 * Advances the fly-in, or the fly-out when {@link beginClose} was called.
	 * Returns true once the closing animation has finished.
	 */
	update(dt: number): boolean {
		// The pearl portrait keeps shining while the codex is open over a paused
		// round; the view needs a tick even after the intro has finished.
		this.view.update(dt)
		if (this.closing) {
			this.outro = Math.min(1, this.outro + dt / CODEX_FLY_OUT_TIME)
			const eased = easeOutCubic(this.outro)
			this.view.y = VIEW.height * eased
			this.view.alpha = 1 - eased
			// The dimmer stays where it is and fades; it never travels with the panel.
			this.blocker.alpha = Math.min(this.blocker.alpha, 1 - eased)
			return this.outro >= 1
		}
		if (this.intro >= 1) return false
		this.intro = Math.min(1, this.intro + dt / CODEX_FLY_TIME)
		const eased = easeOutCubic(this.intro)
		this.view.y = CODEX_FLY_LIFT * (1 - eased)
		this.view.alpha = eased
		this.blocker.alpha = Math.min(1, this.intro / (CODEX_SCRIM_TIME / CODEX_FLY_TIME))
		return false
	}

	handleKey(event: KeyboardEvent): boolean {
		if (this.closing) return false
		return this.view.handleKey(event)
	}
}
