import { Container, Graphics, Sprite } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { easeOutCubic } from '../utils'
import { Screen } from '../ui/Screen'
import { Scrim } from '../ui/Scrim'
import { Button } from '../ui/Button'
import { FocusGroup } from '../ui/FocusGroup'
import { UI } from '../ui/palette'
import { drawPanel, makeText, PANEL_PAD } from '../ui/theme'
import { anchorInk, inkCapCenterY } from '../ui/textInk'
import { ICON_CONTROL, MAIN_TARGET, SECONDARY_TARGET, iconSteps, uiMetrics, type UiMetrics } from '../ui/metrics'
import { CodexTabs } from '../ui/codex/CodexTabs'
import { helpPages, TEXT, type HelpPage } from '../texts'

/** Air under the header row, and between the blocks under it. */
const BLOCK_GAP = 8
/** Room the lesson copy needs beside the still. */
const COPY_GAP = 14

/**
 * A dialog, not a page: 380×186 in the middle of the frame, the same inset
 * rhythm as the pause menu. The manual used to fill the screen and end in a
 * row of page arrows plus a «1 / 4» counter, which made four short lessons read
 * like a document; a popup keeps the menu visible behind it and every lesson
 * is one tab away.
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

function helpLayout(ui: UiMetrics): HelpLayout {
	// Same rule as the codex: a mouse keeps the window's 18 px square, a finger
	// gets the icon-control size so the close mark matches the HUD's marks.
	const CLOSE = ui.pick(18, ui.target(ICON_CONTROL, MAIN_TARGET))
	const tabsHeight = ui.target(16, SECONDARY_TARGET)
	const imageHeight = ui.pick(107, 101)
	// The copy runs down beside the picture, so the card's bottom edge is what it
	// has to clear. The finger copy is a step larger (see `bodySize`), and the six
	// pixels the card grows by are its air under the last line.
	const copySlack = ui.pick(0, 6)
	// A finger gets a slightly narrower still: the copy beside it is set a step up,
	// and the twenty pixels the picture gives back are what keeps the longest
	// lesson — the counter — from running off the card.
	const imageWidth = ui.pick(190, 172)
	// Desktop keeps the window it always had (the arithmetic below lands one
	// pixel off it, and this is a picture, not a formula).
	const height = ui.pick(
		190,
		PANEL_PAD * 2 + CLOSE + BLOCK_GAP + tabsHeight + BLOCK_GAP + imageHeight + copySlack
	)
	const PANEL = {
		x: 50,
		y: ui.pick(40, Math.floor((VIEW.height - height) / 2)),
		width: 380,
		height
	}
	const LEFT = PANEL.x + PANEL_PAD
	const RIGHT = PANEL.x + PANEL.width - PANEL_PAD
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
		width: imageWidth,
		height: imageHeight
	}
	const TEXT_X = IMAGE.x + IMAGE.width + COPY_GAP
	return {
		PANEL,
		LEFT,
		RIGHT,
		TOP,
		CLOSE,
		TABS,
		IMAGE,
		TEXT_X,
		TEXT_W: RIGHT - TEXT_X,
		titleSize: ui.font(14),
		headingSize: ui.font(11),
		// The three rules under each heading are the part the player came to read,
		// and on a phone they were set at the same size as the captions around them.
		// The finger sizes are a whole step up (10 px on a 13 px line) — the same
		// jump the codex blurb takes — and every lesson still ends above the card's
		// bottom edge.
		bodySize: ui.pick(7, 10),
		bodyLine: ui.pick(9, 13)
	}
}

/**
 * Popup motion. The numbers are the codex's own (`ui/CodexOverlay.ts`), so the
 * two dialogs open, hold and leave with one motion: same lift, same rise time,
 * same dimmer fade.
 */
const FLY_LIFT = 26
const FLY_TIME = 0.34
const SCRIM_TIME = 0.24
const FLY_OUT_TIME = FLY_TIME

/**
 * «Как играть», as a popup card.
 *
 * Four lessons — cast, fight, counter, landing — each with one line of the
 * real interface and three lines of copy, switched by the tab bar. There are no
 * page arrows and no counter: the tabs already say what the other lessons are,
 * so a reader jumps straight to the one they need instead of walking a pager.
 * The copy is the touch one on a phone: a manual that names the right mouse
 * button on a screen with no mouse is read as a bug.
 */
export class HelpScreen extends Screen {
	override readonly popup = true
	/**
	 * The popup flies itself: only the card moves. Letting the manager slide the
	 * whole screen dragged the dark sheet across the menu with the panel, which
	 * read as a second page passing over the first instead of a dialog opening on
	 * top of it. The codex closes the same way.
	 */
	override readonly selfFlown = true
	private readonly game: GameContext
	private readonly L: HelpLayout
	private readonly pages: readonly HelpPage[]
	private readonly scrim = new Scrim()
	/** Everything the dialog is drawn from: the only thing that animates. */
	private readonly card = new Container()
	private readonly focus = new FocusGroup()
	private readonly pageLayer = new Container()
	private readonly tabs: CodexTabs
	private pageIndex = 0
	private intro = 0
	private outro = 0
	/**
	 * Pages are painted immediately and their screenshot arrives from the lazy
	 * loader a moment later. The token drops a late answer for a lesson the
	 * player has already switched away from.
	 */
	private renderToken = 0

	constructor(game: GameContext) {
		super()
		this.game = game
		const ui = uiMetrics()
		this.L = helpLayout(ui)
		this.pages = helpPages(game.touch)
		const { PANEL, LEFT, RIGHT, TOP, CLOSE, TABS } = this.L

		// The dimmer is static: it fades where it stands while the card lifts.
		this.scrim.alpha = 0
		this.addChild(this.scrim)
		this.addChild(this.card)

		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.94,
			shadow: true
		})
		this.card.addChild(panel)

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
		this.card.addChild(title)

		const close = new Button({
			width: CLOSE,
			height: CLOSE,
			variant: 'secondary',
			iconTexture: this.game.assets.close,
			iconScale: iconSteps(CLOSE),
			onClick: () => this.close()
		})
		close.position.set(RIGHT - CLOSE, TOP)
		this.card.addChild(close)

		this.tabs = new CodexTabs({
			labels: this.pages.map((page) => page.title),
			width: TABS.width,
			height: TABS.height,
			fontSize: ui.font(8),
			onPick: (index) => {
				this.game.audio.click()
				this.showPage(index)
			},
			onHover: () => this.game.audio.hover()
		})
		this.tabs.position.set(TABS.x, TABS.y)
		this.card.addChild(this.tabs)

		this.card.addChild(this.pageLayer)

		this.focus.setItems([close])
		this.focus.onMove = () => game.audio.hover()

		this.renderPage()

		// The card starts below its resting place and out of sight: the dimmer is
		// already there, the panel rises into it.
		this.card.y = FLY_LIFT
		this.card.alpha = 0
	}

	/** The rise, played once on entry. */
	override update(dt: number): void {
		if (this.intro >= 1) return
		this.intro = Math.min(1, this.intro + dt / FLY_TIME)
		const eased = easeOutCubic(this.intro)
		this.card.y = FLY_LIFT * (1 - eased)
		this.card.alpha = eased
		this.scrim.alpha = Math.min(1, this.intro / (SCRIM_TIME / FLY_TIME))
	}

	/**
	 * The card drops out of the frame while the dimmer fades where it stands.
	 * Sliding the whole screen, as an ordinary popup does, dragged the dark sheet
	 * down with the panel and left the menu dimmed from the top.
	 */
	override animateOut(dt: number): void {
		if (this.outro === 0) {
			// Nothing may take a click while the dialog is leaving.
			this.scrim.eventMode = 'none'
			this.card.interactiveChildren = false
		}
		this.outro = Math.min(1, this.outro + dt / FLY_OUT_TIME)
		const eased = easeOutCubic(this.outro)
		this.card.y = VIEW.height * eased
		this.card.alpha = 1 - eased
		this.scrim.alpha = Math.min(this.scrim.alpha, 1 - eased)
	}

	private close(): void {
		this.game.audio.back()
		this.game.showMenu()
	}

	private showPage(index: number): void {
		const next = Math.max(0, Math.min(this.pages.length - 1, index))
		if (next === this.pageIndex) return
		this.pageIndex = next
		this.renderPage()
	}

	private renderPage(): void {
		for (const child of this.pageLayer.removeChildren()) {
			child.destroy({ children: true })
		}
		this.tabs.setSelected(this.pageIndex)

		const { IMAGE, TEXT_X, TEXT_W } = this.L
		const token = (this.renderToken += 1)
		const page: HelpPage = this.pages[this.pageIndex]
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
		let lineY = ruleY + 8
		for (const line of page.lines) {
			const text = makeText(line, {
				size: this.L.bodySize,
				color: UI.text,
				lineHeight: this.L.bodyLine,
				wordWrapWidth: TEXT_W - 10
			})
			text.position.set(TEXT_X + 9, lineY)
			text.alpha = 0.94
			this.pageLayer.addChild(text)

			// The marker is centred on the capitals of the first line, not on the top
			// of the text box: the box is the font's line box and its top sits a pixel
			// or two above the letters, which left the square hanging over the words
			// and the copy reading as if it had slid down. A wrapped rule keeps the
			// marker on its first row.
			const bullet = new Graphics()
			const bulletY = Math.round(lineY + inkCapCenterY(text) - 1.5)
			bullet.rect(TEXT_X, bulletY, 3, 3).fill(UI.periwinkle)
			this.pageLayer.addChild(bullet)
			// `text.height` is the wrapped block, so the row after it is measured
			// from what this one actually took.
			lineY += Math.ceil(text.height) + 2
		}
	}

	override onEnter(): void {
		// No button is outlined until the keyboard is used: the ring marks where
		// an arrow key will land, not a choice that has already been made.
	}

	override onExit(): void {
		this.focus.blur()
	}

	override handleKey(event: KeyboardEvent): boolean {
		if (event.code === 'Escape' || event.code === 'Backspace') {
			this.close()
			return true
		}
		if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
			this.showPage(this.pageIndex - 1)
			return true
		}
		if (event.code === 'ArrowRight' || event.code === 'KeyD') {
			this.showPage(this.pageIndex + 1)
			return true
		}
		return this.focus.handleKey(event)
	}
}
