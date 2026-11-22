import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import type { AreaId } from '../types'
import { TEXT } from '../texts'
import { Screen } from '../ui/Screen'
import { Backdrop } from '../ui/Backdrop'
import { Button } from '../ui/Button'
import { FocusGroup } from '../ui/FocusGroup'
import { FullscreenToggle } from '../ui/FullscreenToggle'
import { UI } from '../ui/palette'
import { makeText } from '../ui/theme'
import { ICON_CONTROL, MAIN_TARGET, iconSteps } from '../ui/metrics'

/** Rows of the title screen, and the air between them. */
const MAIN = { x: 130, y: 92, width: 220, height: 28, gap: 8 }
const FOOTER = { y: 206, height: 24, width: 106, gap: 8 }
/** Centre of the «играть» button: where the travel wipe opens from. */
const PLAY_WIPE = { x: MAIN.x + MAIN.width / 2, y: MAIN.y + 17 }
/** Air of the corner control from the frame edge, as in the round's HUD. */
const CORNER_INSET = { mouse: 12, touch: 8 } as const

export class MenuScreen extends Screen {
	private readonly game: GameContext
	/** Water body the backdrop and the «играть» button point at. */
	readonly areaId: AreaId
	private readonly backdrop: Backdrop
	private readonly focus = new FocusGroup()
	private readonly buttons: Button[] = []
	/** Fullscreen, top-left, on a phone only; the title screen keeps the door. */
	private readonly fullscreen: FullscreenToggle | null
	private muteButton!: Button

	constructor(game: GameContext) {
		super()
		this.game = game
		this.areaId = game.areaId
		game.audio.setAmbience(game.areaId)
		this.backdrop = new Backdrop(game.previewFor(game.areaId), game.clock, game.area)
		this.addChild(this.backdrop)

		this.buildTitle()
		this.buildButtons()

		// The route used to carry this control over the canvas on every screen; the
		// menu keeps it so the player is not locked into fullscreen until the next
		// round. It is not part of the button stack: it is a corner control, and a
		// keyboard walk through the title screen should not stop on it.
		const ui = game.ui
		const size = ui.target(ICON_CONTROL, MAIN_TARGET)
		this.fullscreen =
			ui.touch && FullscreenToggle.available
				? new FullscreenToggle(game.assets.fullscreen, size, iconSteps(size), ui.pick(0, 3))
				: null
		if (this.fullscreen) {
			const inset = ui.pick(CORNER_INSET.mouse, CORNER_INSET.touch)
			this.fullscreen.position.set(inset, inset)
			this.addChild(this.fullscreen)
		}
	}

	private buildTitle(): void {
		// The wordmark carries the screen: at the menu the name is the biggest thing
		// on it, and the rows read as a short list under it instead of as its equal.
		// Same 480-wide frame, so the size is the frame's, not the device's.
		const title = makeText(TEXT.menu.title, {
			size: 36,
			weight: 800,
			color: UI.text,
			align: 'center',
			letterSpacing: 0.5,
			outline: true
		})
		title.position.set(VIEW.width / 2, 30)
		this.addChild(title)
	}

	private buildButtons(): void {
		const ui = this.game.ui
		const gap = ui.pick(MAIN.gap, 8)
		const playHeight = ui.target(34, MAIN_TARGET)
		const rowHeight = ui.target(24, MAIN_TARGET)
		const footerHeight = ui.target(FOOTER.height, MAIN_TARGET)
		// The pitch is the row the buttons were drawn on, not the button's own
		// height: on the mouse the two differ by four pixels and the desktop column
		// has to stay exactly where it was. On a finger the row and the button are
		// the same height, so the stack is flush.
		const pitch = ui.pick(MAIN.height, rowHeight)

		// The column is stacked, not placed on a fixed grid: a taller row on a
		// phone pushes the next one down instead of overlapping it. The positions
		// are worked out before anything is built, because a short frame — a
		// landscape browser with its toolbars on screen — can leave less room than
		// the stack needs, and lifting it beats clipping the footer off the frame.
		const rows: number[] = []
		let cursor = MAIN.y
		rows.push(cursor)
		cursor += playHeight + gap
		rows.push(cursor)
		cursor += pitch + gap
		rows.push(cursor)
		cursor += pitch + gap
		let footerY = ui.pick(FOOTER.y, cursor)
		const overflow = footerY + footerHeight + 8 - VIEW.height
		const shift = Math.max(0, Math.min(overflow, MAIN.y - 8))
		for (let index = 0; index < rows.length; index += 1) rows[index] -= shift
		footerY -= shift

		const play = this.makeMainButton(
			TEXT.common.play,
			rows[0],
			playHeight,
			ui.font(14),
			'primary',
			// Straight into the water body the player left last: the picker is no
			// longer a step on the way in. Travel between the three waters stays in
			// the round itself, on the corner cards.
			() => this.game.startGame(this.game.areaId, PLAY_WIPE)
		)
		const codex = this.makeMainButton(
			TEXT.codex.title,
			rows[1],
			rowHeight,
			ui.font(12),
			'secondary',
			// The codex always comes back to the title now: the water picker is gone
			// and travel between the remaining bodies happens in the round itself.
			() => this.game.showCodex()
		)
		const help = this.makeMainButton(
			TEXT.common.howToPlay,
			rows[2],
			rowHeight,
			ui.font(12),
			'secondary',
			() => this.game.showHelp()
		)
		this.buttons.push(play, codex, help)

		const hasExit = this.game.options.onExit !== undefined
		const footerWidth = hasExit ? FOOTER.width : FOOTER.width * 2 + FOOTER.gap

		this.muteButton = new Button({
			label: this.muteLabel(),
			width: footerWidth,
			height: footerHeight,
			size: ui.font(10),
			onClick: () => {
				this.game.toggleMute()
				this.muteButton.setLabel(this.muteLabel())
			}
		})
		this.muteButton.position.set(MAIN.x, footerY)
		this.addChild(this.muteButton)
		this.buttons.push(this.muteButton)

		if (hasExit) {
			const exit = new Button({
				label: TEXT.common.exit,
				width: FOOTER.width,
				height: footerHeight,
				size: ui.font(10),
				onClick: () => this.game.exit()
			})
			exit.position.set(MAIN.x + FOOTER.width + FOOTER.gap, footerY)
			this.addChild(exit)
			this.buttons.push(exit)
		}

		this.focus.setItems(this.buttons)
		this.focus.onMove = () => this.game.audio.hover()
	}

	private makeMainButton(
		label: string,
		y: number,
		height: number,
		size: number,
		variant: 'primary' | 'secondary',
		onClick: () => void
	): Button {
		const button = new Button({
			label,
			width: MAIN.width,
			height,
			variant,
			size,
			onClick
		})
		button.position.set(MAIN.x, y)
		this.addChild(button)
		return button
	}

	private muteLabel(): string {
		return this.game.muted ? TEXT.common.soundOff : TEXT.common.soundOn
	}

	override onEnter(): void {
		// Nothing is outlined on entry: the ring is a keyboard affordance, and it
		// appears on the first arrow key (see `FocusGroup`).
	}

	override onExit(): void {
		this.focus.blur()
	}

	override onMuteChanged(): void {
		this.muteButton.setLabel(this.muteLabel())
	}

	override update(dt: number): void {
		this.backdrop.update(dt)
	}

	override handleKey(event: KeyboardEvent): boolean {
		if (event.code === 'Escape') return true
		return this.focus.handleKey(event)
	}
}
