import { Container, Graphics, Rectangle } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { TEXT } from '../texts'
import { easeOutCubic } from '../utils'
import { Button } from './Button'
import { FocusGroup } from './FocusGroup'
import { UI } from './palette'
import { PANEL_PAD, drawPanel, makeText } from './theme'
import { MAIN_TARGET, type UiMetrics } from './metrics'

export interface PauseMenuHandlers {
	onResume(): void
}

/**
 * Centred dialog with the same inner padding on all four sides.
 *
 * It used to carry a «сменить водоем» entry under «продолжить», and later the
 * «справочник» one. The two travel cards in the corners of the round do the
 * first job in one click, and the codex has its own control beside the pause
 * button in the HUD, so the panel is down to the entries that leave or pause
 * the round itself — and its height follows the three rows that are left.
 */
const PANEL = { x: 130, y: 53, width: 220 }
/** Height of the «ПАУЗА» wordmark block above the first row. */
const TITLE_BLOCK = 22
/** Air between the wordmark and the first row. */
const TITLE_GAP = 8
const BUTTON_H = 21
const BUTTON_GAP = 6
/** How far the panel rises while it flies in, in pixels. */
const FLY_IN = 22
const FLY_TIME = 0.24
const FLY_OUT_TIME = 0.2

/**
 * Pause overlay with the resume/sound/menu column and keyboard focus
 * navigation. The screen owns the paused state and plays the UI sounds; the
 * menu only renders the panel and tracks which button is focused.
 */
export class PauseMenu extends Container {
	private readonly game: GameContext
	private readonly focus = new FocusGroup()
	private readonly soundButton: Button
	/** The dialog itself; the dimmer behind it stays put while this flies in. */
	private readonly panelLayer = new Container()
	private intro = 1
	private closing = false
	private outro = 0

	constructor(game: GameContext, handlers: PauseMenuHandlers) {
		super()
		this.game = game
		this.visible = false

		// The panel is as tall as the three rows it holds, so a phone gets a taller
		// dialog instead of three cramped ones. On a fine pointer the arithmetic
		// lands exactly on the 220×137 window it always was.
		const ui: UiMetrics = game.ui
		const buttonH = ui.target(BUTTON_H, MAIN_TARGET)
		const buttonGap = ui.pick(BUTTON_GAP, 8)
		const buttonW = PANEL.width - PANEL_PAD * 2
		const buttonX = PANEL.x + PANEL_PAD
		const height = PANEL_PAD * 2 + TITLE_BLOCK + TITLE_GAP + buttonH * 3 + buttonGap * 2
		const y = ui.pick(PANEL.y, Math.floor((VIEW.height - height) / 2))
		const buttonY = y + PANEL_PAD + TITLE_BLOCK + TITLE_GAP

		const blocker = new Graphics()
		blocker.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.scrim, alpha: 0.72 })
		blocker.eventMode = 'static'
		blocker.cursor = CURSORS.default
		blocker.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
		this.addChild(blocker)
		this.addChild(this.panelLayer)

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, y, PANEL.width, height, {
			fill: UI.panel,
			alpha: 0.98,
			shadow: true
		})
		this.panelLayer.addChild(panel)

		const title = makeText(TEXT.common.pause, {
			size: ui.font(18),
			weight: 800,
			color: UI.text,
			align: 'center',
			letterSpacing: 2
		})
		title.position.set(240, y + PANEL_PAD)
		this.panelLayer.addChild(title)

		const resume = new Button({
			label: TEXT.common.resume,
			width: buttonW,
			height: buttonH,
			variant: 'primary',
			size: ui.font(11),
			onClick: handlers.onResume
		})
		resume.position.set(buttonX, buttonY)
		this.panelLayer.addChild(resume)

		this.soundButton = new Button({
			label: this.muteLabel(),
			width: buttonW,
			height: buttonH,
			size: ui.font(11),
			onClick: () => this.game.toggleMute()
		})
		this.soundButton.position.set(buttonX, buttonY + buttonH + buttonGap)
		this.panelLayer.addChild(this.soundButton)

		const menu = new Button({
			label: TEXT.common.menu,
			width: buttonW,
			height: buttonH,
			size: ui.font(11),
			onClick: () => this.game.showMenu()
		})
		menu.position.set(buttonX, buttonY + (buttonH + buttonGap) * 2)
		this.panelLayer.addChild(menu)

		this.focus.setItems([resume, this.soundButton, menu])
		this.focus.onMove = () => this.game.audio.hover()
	}

	open(): void {
		this.visible = true
		this.closing = false
		this.outro = 0
		this.alpha = 1
		this.interactiveChildren = true
		// The panel rises from below the frame like a popup instead of popping in
		// over the paused lake. The dimmer is already there, so nothing flashes.
		this.intro = 0
		this.panelLayer.y = FLY_IN
		this.panelLayer.alpha = 0
		// The panel opens unlit: the ring appears on the first arrow key, so no
		// button is pre-selected for a player who is about to use the mouse.
		this.focus.reset()
	}

	/** Advances the fly-in or fly-out; the screen ticks this every frame. */
	update(dt: number): void {
		if (this.closing) {
			this.outro = Math.min(1, this.outro + dt / FLY_OUT_TIME)
			const eased = easeOutCubic(this.outro)
			this.panelLayer.y = FLY_IN * eased
			this.alpha = 1 - eased
			if (this.outro >= 1) {
				this.closing = false
				this.visible = false
				this.alpha = 1
				this.panelLayer.y = 0
				this.panelLayer.alpha = 1
			}
			return
		}
		if (!this.visible || this.intro >= 1) return
		this.intro = Math.min(1, this.intro + dt / FLY_TIME)
		const eased = easeOutCubic(this.intro)
		this.panelLayer.y = FLY_IN * (1 - eased)
		this.panelLayer.alpha = Math.min(1, this.intro * 2.2)
	}

	close(): void {
		if (!this.visible) return
		// The dialog drops back down instead of blinking out; the round is already
		// running again behind it, so the fade-out has to be quick and uninteractive.
		this.closing = true
		this.outro = 0
		this.interactiveChildren = false
		this.focus.blur()
	}

	/** Drops the button highlight without hiding the panel (codex on top). */
	blur(): void {
		this.focus.blur()
	}

	/**
	 * True while the dialog is on screen, fly-in and fly-out included. The screen
	 * reads it to tell a codex opened over this dialog from one opened straight
	 * from the HUD: only the second one has to bring the round back on close.
	 */
	get isOpen(): boolean {
		return this.visible
	}

	/** Focuses one of the panel buttons by index. */
	focusAt(index: number): void {
		// Restoring the ring after an overlay closes is only right when the
		// keyboard was already driving this panel; a mouse user gets no ring.
		if (this.focus.keyboardActive) this.focus.focus(index)
		else this.focus.select(index)
	}

	handleKey(event: KeyboardEvent): boolean {
		return this.focus.handleKey(event)
	}

	/** Repaints the sound entry after the mute state changed. */
	refreshSound(): void {
		this.soundButton.setLabel(this.muteLabel())
	}

	private muteLabel(): string {
		return this.game.muted ? TEXT.common.soundOff : TEXT.common.soundOn
	}
}
