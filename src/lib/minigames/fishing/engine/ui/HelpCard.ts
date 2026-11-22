import { CanvasTextMetrics, Container, Graphics, Sprite } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { Button } from './Button'
import { CodexTabs } from './codex/CodexTabs'
import { FocusGroup } from './FocusGroup'
import { UI } from './palette'
import { drawPanel, makeText, PANEL_PAD, SCREEN_INSET } from './theme'
import { anchorInk, inkCapCenterY } from './textInk'
import {
	ICON_CONTROL,
	MAIN_TARGET,
	SECONDARY_TARGET,
	iconSteps,
	uiMetrics,
	type UiMetrics
} from './metrics'
import { drawCopy, parseCopyLine } from './richCopy'
import { helpPages, TEXT, type HelpPage, type HelpPageId } from '../texts'

/** Air under the header row, and between the blocks under it. */
const BLOCK_GAP = 8
/** Room the lesson copy needs beside the still. */
const COPY_GAP = 14
/** Air under the last rule of the copy. */
const COPY_SLACK = 4
/**
 * Aspect of the help stills. The still's frame follows it, so shrinking the
 * picture to give the copy room never squashes the screenshot.
 */
const STILL_ASPECT = 190 / 107

/**
 * Height the copy of one lesson needs, measured before anything is drawn.
 *
 * The card is as tall as its tallest lesson, so the panel has to know that number
 * up front — the alternative was a fixed window that the new, longer lessons ran
 * out of. The wrap is measured the same way `drawCopy` measures it (Pixi's own
 * `CanvasTextMetrics` on the plain text), and each rule adds the small gap the
 * painter leaves under it.
 */
function pageCopyHeight(page: HelpPage, size: number, lineHeight: number, width: number): number {
	let total = 0
	for (const line of page.lines) {
		const plain = parseCopyLine(line)
			.map((run) => run.text)
			.join('')
		if (plain.length === 0) continue
		const probe = makeText(plain, { size, lineHeight, wordWrapWidth: width })
		const metrics = CanvasTextMetrics.measureText(plain, probe.style, undefined, true)
		probe.destroy()
		total += metrics.lines.length * lineHeight + 2
	}
	return total
}

/**
 * The manual as a dialog: 380×190 in the middle of the frame, the same inset
 * rhythm as the pause menu. It used to fill the screen and end in a row of page
 * arrows plus a «1 / 4» counter, which made four short lessons read like a
 * document; a popup keeps the menu visible behind it and every lesson is one
 * tab away.
 *
 * On a touch screen the same card grows: the close button and the tab bar are
 * finger-sized, and the window is as tall as the blocks they push down. Nothing
 * is cropped at either end of the scale.
 */
interface HelpLayout {
	PANEL: { x: number; y: number; width: number; height: number }
	LEFT: number
	RIGHT: number
	TOP: number
	CLOSE: number
	TABS: { x: number; y: number; width: number; height: number }
	IMAGE: { x: number; y: number; width: number; height: number }
	TEXT_X: number
	TEXT_W: number
	titleSize: number
	headingSize: number
	bodySize: number
	bodyLine: number
}

function helpLayout(ui: UiMetrics, pages: readonly HelpPage[]): HelpLayout {
	// Same rule as the codex: a mouse keeps the window's 18 px square, a finger
	// gets the icon-control size so the close mark matches the HUD's marks.
	const CLOSE = ui.pick(18, ui.target(ICON_CONTROL, MAIN_TARGET))
	const tabsHeight = ui.target(16, SECONDARY_TARGET)
	// A finger gets the whole frame: the touch lessons spell the stick out, so
	// their copy is longer, and the extra width is what keeps it short enough to
	// fit a card that may not grow past the frame.
	const width = ui.pick(380, VIEW.width - SCREEN_INSET * 2)
	const x = ui.pick(50, SCREEN_INSET)
	const LEFT = x + PANEL_PAD
	const RIGHT = x + width - PANEL_PAD
	// A finger gets a slightly narrower still: the copy beside it is set a step up,
	// and the pixels the picture gives back are what keeps the longest lesson — the
	// counter — from running off the card.
	const imageWidth = ui.pick(190, 172)
	const TEXT_X = LEFT + imageWidth + COPY_GAP
	const TEXT_W = RIGHT - TEXT_X
	const bodySize = ui.pick(7, 10)
	const bodyLine = ui.pick(9, 13)
	const headingSize = ui.font(11)

	// The panel is sized by its tallest lesson: the copy column is measured before
	// the card is drawn, so no rule can run off the bottom on any page. When the
	// size that needs does not fit the frame, the still gives up width (and height
	// with it) until the copy does — the picture is the reference, the copy is what
	// the player came to read.
	const maxHeight = VIEW.height - SCREEN_INSET * 2
	const measure = (imageW: number) => {
		const textX = LEFT + imageW + COPY_GAP
		const textW = RIGHT - textX
		const copy = Math.max(
			0,
			...pages.map((page) => pageCopyHeight(page, bodySize, bodyLine, textW - 10))
		)
		const imageH = Math.round((imageW - 8) / STILL_ASPECT) + 6
		const column = Math.max(imageH, headingSize + 14 + copy)
		const needed = Math.round(
			PANEL_PAD * 2 + CLOSE + BLOCK_GAP + tabsHeight + BLOCK_GAP + column + COPY_SLACK
		)
		return { textX, textW, imageH, needed }
	}
	let still = imageWidth
	let fit = measure(still)
	while (fit.needed > maxHeight && still > 120) {
		still -= 6
		fit = measure(still)
	}
	const height = Math.min(fit.needed, maxHeight)
	const PANEL = {
		x,
		y: Math.round((VIEW.height - height) / 2),
		width,
		height
	}
	const TOP = PANEL.y + PANEL_PAD
	const TABS = {
		x: LEFT,
		y: TOP + CLOSE + BLOCK_GAP,
		width: RIGHT - LEFT,
		height: tabsHeight
	}
	const IMAGE = {
		x: LEFT,
		y: TABS.y + TABS.height + BLOCK_GAP,
		width: still,
		height: fit.imageH
	}
	return {
		PANEL,
		LEFT,
		RIGHT,
		TOP,
		CLOSE,
		TABS,
		IMAGE,
		TEXT_X: fit.textX,
		TEXT_W: fit.textW,
		titleSize: ui.font(14),
		headingSize,
		// The rules under each heading are the part the player came to read, and on
		// a phone they were set at the same size as the captions around them. The
		// finger sizes are a whole step up (10 px on a 13 px line) — the same jump
		// the codex blurb takes — and the card grows to hold them.
		bodySize,
		bodyLine
	}
}

/** Popup motion, shared with the codex dialog so both open alike. */
export const HELP_FLY_LIFT = 26
export const HELP_FLY_TIME = 0.34
export const HELP_SCRIM_TIME = 0.24

/**
 * The «Как играть» card on its own: the panel, the tab bar, one still of the
 * real interface and the copy of the selected lesson.
 *
 * It is a container rather than a screen because two things show the manual —
 * the menu's popup and, when a player asks for it mid-round, the same popup
 * opened from the pause menu. The card owns everything both of them draw; the
 * owners only decide where it appears, how it moves and what its close button
 * does.
 *
 * The in-round note a mechanic opens by itself is a different thing entirely and
 * does not use this card: see `ui/TutorialHint.ts`.
 */
export class HelpCard extends Container {
	private readonly L: HelpLayout
	private readonly pages: readonly HelpPage[]
	private readonly game: GameContext
	/** Everything the dialog is drawn from: what the owner animates. */
	private readonly panelLayer = new Container()
	private readonly pageLayer = new Container()
	/** The lesson switcher of the full manual. */
	private readonly tabs: CodexTabs
	private readonly focus = new FocusGroup()
	private index = 0
	/**
	 * Pages are painted immediately and their screenshot arrives from the lazy
	 * loader a moment later. The token drops a late answer for a lesson the
	 * player has already switched away from.
	 */
	private renderToken = 0

	constructor(game: GameContext, onClose: () => void) {
		super()
		this.game = game
		const ui = uiMetrics()
		this.pages = helpPages(game.touch)
		this.L = helpLayout(ui, this.pages)
		const { PANEL, LEFT, RIGHT, TOP, CLOSE, TABS } = this.L

		this.addChild(this.panelLayer)
		this.panelLayer.addChild(this.pageLayer)

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.96,
			shadow: true
		})
		this.panelLayer.addChildAt(panel, 0)

		const title = makeText(TEXT.help.title, {
			size: this.L.titleSize,
			weight: 800,
			color: UI.text,
			letterSpacing: 1
		})
		// The wordmark and the close button are one row: the title is centred on
		// the button's middle, not on the top of the font's line box.
		anchorInk(title, 'left', 'center')
		title.position.set(LEFT, TOP + CLOSE / 2)
		this.panelLayer.addChild(title)

		const close = new Button({
			width: CLOSE,
			height: CLOSE,
			variant: 'secondary',
			iconTexture: game.assets.close,
			iconScale: iconSteps(CLOSE),
			onClick: onClose
		})
		close.position.set(RIGHT - CLOSE, TOP)
		this.panelLayer.addChild(close)

		this.tabs = new CodexTabs({
			labels: this.pages.map((page) => page.title),
			width: TABS.width,
			height: TABS.height,
			fontSize: ui.font(8),
			onPick: (index) => {
				// The card answers every press with the ordinary click: switching a
				// lesson is not a step back out of the manual.
				game.audio.click()
				this.showPage(index)
			},
			onHover: () => game.audio.hover()
		})
		this.tabs.position.set(TABS.x, TABS.y)
		this.panelLayer.addChild(this.tabs)

		this.focus.setItems([close])
		this.focus.onMove = () => game.audio.hover()

		this.renderPage()
	}

	/** Lesson on screen, 0-based. */
	get pageIndex(): number {
		return this.index
	}

	/** Lessons in the manual, in tab order. */
	get pageCount(): number {
		return this.pages.length
	}

	showPage(index: number): void {
		const next = Math.max(0, Math.min(this.pages.length - 1, index))
		if (next === this.index) return
		this.index = next
		this.renderPage()
	}

	/** Opens the lesson with this id; the tabs still switch away from it. */
	showLesson(id: HelpPageId): void {
		const index = this.pages.findIndex((page) => page.id === id)
		if (index >= 0) this.showPage(index)
	}

	/**
	 * Keyboard: the close button takes the focus keys, the arrows page through
	 * the lessons.
	 */
	handleKey(event: KeyboardEvent): boolean {
		if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
			this.showPage(this.index - 1)
			return true
		}
		if (event.code === 'ArrowRight' || event.code === 'KeyD') {
			this.showPage(this.index + 1)
			return true
		}
		return this.focus.handleKey(event)
	}

	/** Drops the keyboard highlight; called when the card stops being modal. */
	blur(): void {
		this.focus.blur()
	}

	private renderPage(): void {
		for (const child of this.pageLayer.removeChildren()) {
			child.destroy({ children: true })
		}
		this.tabs?.setSelected(this.index)

		const { IMAGE, TEXT_X, TEXT_W } = this.L
		const token = (this.renderToken += 1)
		const page: HelpPage = this.pages[this.index]
		const frame = new Graphics()
		drawPanel(frame, IMAGE.x, IMAGE.y, IMAGE.width, IMAGE.height, {
			fill: UI.ink,
			alpha: 0.55,
			shadow: false
		})
		this.pageLayer.addChild(frame)

		// The screenshot is loaded on demand (see `assets.ts`): four images used to
		// ride the boot path even though they live behind this screen. The frame is
		// already painted, so the page behaves with a short gap.
		const imageLayer = new Container()
		const mask = new Graphics()
		mask.rect(IMAGE.x + 4, IMAGE.y + 2, IMAGE.width - 8, IMAGE.height - 6).fill(0xffffff)
		this.pageLayer.addChild(mask)
		imageLayer.mask = mask
		this.pageLayer.addChild(imageLayer)

		void this.game.helpTexture(page.id).then((texture) => {
			if (token !== this.renderToken) return
			const illustration = new Sprite(texture)
			illustration.width = IMAGE.width - 8
			illustration.height = IMAGE.height - 6
			illustration.eventMode = 'none'
			illustration.position.set(IMAGE.x + 4, IMAGE.y + 2)
			imageLayer.addChild(illustration)
		})

		const heading = makeText(page.title, {
			size: this.L.headingSize,
			weight: 800,
			color: UI.text,
			letterSpacing: 0.4
		})
		heading.position.set(TEXT_X, IMAGE.y)
		this.pageLayer.addChild(heading)

		// The rule sits a fixed gap under the heading's caps, not at a fixed pixel:
		// a bigger heading on a phone would otherwise have the line drawn through
		// it. The arithmetic lands on the desktop 17 and 25 by itself.
		const ruleY = IMAGE.y + this.L.headingSize + 6
		const divider = new Graphics()
		divider.rect(TEXT_X, ruleY, TEXT_W, 1).fill({
			color: UI.periwinkle,
			alpha: 0.4
		})
		this.pageLayer.addChild(divider)

		// Bullets hang off the rule. Copy wraps inside the column, so a long rule
		// takes two lines and the next one starts below it instead of behind.
		//
		// The marker is centred on the capitals of the first line, not on the top of
		// the text box: the box is the font's line box and its top sits a pixel or
		// two above the letters, which left the square hanging over the words and
		// the copy reading as if it had slid down. Every rule of a page is set in
		// the same style, so the offset is measured once.
		const probe = makeText('', { size: this.L.bodySize, lineHeight: this.L.bodyLine })
		const capCentre = inkCapCenterY(probe)
		probe.destroy()
		let lineY = ruleY + 8
		for (const line of page.lines) {
			const height = drawCopy(this.pageLayer, line, {
				x: TEXT_X,
				y: lineY,
				width: TEXT_W - 10,
				size: this.L.bodySize,
				lineHeight: this.L.bodyLine,
				alpha: 0.94
			})
			const bullet = new Graphics()
			const bulletY = Math.round(lineY + capCentre - 1.5)
			bullet.rect(TEXT_X, bulletY, 3, 3).fill(UI.periwinkle)
			this.pageLayer.addChild(bullet)
			lineY += Math.ceil(height) + 2
		}
	}
}
