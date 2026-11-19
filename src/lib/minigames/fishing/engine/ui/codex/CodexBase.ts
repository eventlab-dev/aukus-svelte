import { Container, Graphics, Sprite, Text } from 'pixi.js'
import type { GameContext } from '../../GameContext'
import { AREAS, type AreaDef } from '../../areas'
import { TEXT } from '../../texts'
import type { AreaId } from '../../types'
import { Button } from '../Button'
import { FocusGroup } from '../FocusGroup'
import { UI } from '../palette'
import { drawPanel, makeText } from '../theme'
import { anchorInk, inkTopInset } from '../textInk'
import { iconSteps } from '../metrics'
import { CodexTabs } from './CodexTabs'
import { SelectionRing } from './selectionRing'
import { codexLayout, type Cell, type CodexLayout } from './setup'

export abstract class CodexBase extends Container {
	protected readonly game: GameContext
	protected readonly onClose: () => void
	/** Window geometry for this input; see `codex/setup.ts`. */
	protected readonly L: CodexLayout
	protected tabs!: CodexTabs
	protected readonly focus = new FocusGroup()
	protected cells: Cell[] = []
	protected readonly cellsByArea = new Map<AreaId, Cell[]>()
	protected readonly gridContainers = new Map<AreaId, Container>()
	protected area: AreaDef
	protected mode: 'tabs' | 'grid' = 'grid'

	protected readonly gridLayer = new Container()
	/** Both columns: tabs, roster and entry card. */
	private readonly columns = new Container()
	/** Ring around the entry whose details the card is showing. */
	private readonly selection = new SelectionRing()

	/** Fixed entry card on the right of the split. */
	protected readonly detailsLayer = new Container()
	private readonly detailsPanel = new Graphics()
	private readonly portraitSlot = new Graphics()
	/** Hairline above the footer; hidden while the species is still unknown. */
	protected readonly footerRule = new Graphics()
	protected readonly portrait = new Sprite()
	protected readonly detailsName: Text
	protected readonly detailsType: Text
	protected readonly detailsRecord: Text
	protected readonly detailsDesc: Text
	private readonly wrap: number

	constructor(game: GameContext, initialAreaId: AreaId, onClose: () => void) {
		super()
		this.game = game
		this.onClose = onClose
		this.L = codexLayout()
		this.area = AREAS.find((area) => area.id === initialAreaId) ?? AREAS[0]

		const ui = game.ui
		this.wrap = this.L.DETAILS.width - this.L.DETAILS.pad * 2
		this.detailsName = makeText('', {
			size: ui.font(10),
			weight: 800,
			color: UI.text,
			align: 'center'
		})
		this.detailsType = makeText('', {
			size: ui.font(6.5),
			color: UI.textMuted,
			align: 'center'
		})
		this.detailsRecord = makeText('', {
			size: ui.font(6),
			color: UI.textMuted
		})
		this.detailsDesc = makeText('', {
			// A finger reads the entry at arm's length: the blurb is the paragraph the
			// codex is opened for, so it grows further than the labels around it
			// (10 px against the 6.5 px a desktop gets) and its line box follows.
			size: ui.pick(6.5, 10),
			color: UI.textMuted,
			lineHeight: this.L.DETAILS.bodyLineHeight,
			wordWrapWidth: this.wrap
		})

		this.buildChrome()
		this.buildDetails()
		this.buildGrids()
		// The two columns live in one container of their own, so they are laid out
		// and flown in as one block. The ring sits above every grid, so it marks the
		// shown entry no matter which tab drew the cells.
		this.columns.addChild(this.tabs)
		this.columns.addChild(this.gridLayer)
		this.gridLayer.addChild(this.selection)
		this.columns.addChild(this.detailsLayer)
		this.addChild(this.columns)
		this.selectArea(this.area)
	}

	protected buildChrome(): void {
		const { PANEL, CONTENT, TITLE, TABS, closeSize } = this.L
		const panel = new Graphics()
		drawPanel(panel, PANEL.x, PANEL.y, PANEL.width, PANEL.height, {
			fill: UI.panel,
			alpha: 0.97,
			shadow: true
		})
		this.addChild(panel)

		const title = makeText(TEXT.codex.title, {
			size: 18,
			weight: 800,
			color: UI.text,
			letterSpacing: 1
		})
		// The wordmark and the close button are one row, so the title is centred on
		// the button's middle (not on the top of the font's line box, which put the
		// capitals a few pixels lower than the close cross).
		anchorInk(title, 'left', 'center')
		title.position.set(TITLE.x, TITLE.y + closeSize / 2)
		this.addChild(title)

		// Standard secondary button with the close tile: the codex used to end
		// with a full ice-white «ЗАКРЫТЬ» bar, which competed with the title for
		// the eye, and then with the letter «Х» from the pixel font, which carried
		// softer edges than every other mark on the frame.
		const close = new Button({
			width: closeSize,
			height: closeSize,
			variant: 'secondary',
			iconTexture: this.game.assets.close,
			iconScale: iconSteps(closeSize),
			onClick: () => this.onClose()
		})
		close.position.set(CONTENT.right - closeSize, TITLE.y)
		this.addChild(close)

		this.tabs = new CodexTabs({
			labels: AREAS.map((area) => area.name),
			width: TABS.width,
			height: TABS.height,
			fontSize: this.game.ui.font(8),
			onPick: (index) => {
				this.game.audio.click()
				this.selectArea(AREAS[index])
			},
			onHover: () => this.game.audio.hover()
		})
		this.tabs.position.set(TABS.x, TABS.y)
		this.addChild(this.tabs)

		this.focus.onMove = () => this.showFocusedDetails()
	}

	/**
	 * The entry card is built once: a dark plate (the same ink the old floating
	 * tooltip used), a portrait slot, the name, the water and tier, the record and
	 * the blurb. Only the text changes as the pointer moves, so hovering the
	 * roster never re-rasterizes a panel.
	 */
	protected buildDetails(): void {
		const DETAILS = this.L.DETAILS
		const { width, height, pad } = DETAILS
		this.detailsLayer.position.set(DETAILS.x, DETAILS.y)
		this.detailsLayer.eventMode = 'none'

		drawPanel(this.detailsPanel, 0, 0, width, height, {
			fill: UI.ink,
			alpha: 0.55
		})
		this.detailsLayer.addChild(this.detailsPanel)

		const centre = width / 2
		const { y, width: portraitWidth, height: portraitHeight } = DETAILS.portrait
		// A lighter well behind the fish: an uncaught species is drawn as a black
		// silhouette and would vanish straight into the ink of the card.
		this.portraitSlot
			.rect(centre - portraitWidth / 2, y, portraitWidth, portraitHeight)
			.fill({ color: UI.surface, alpha: 0.5 })
		this.detailsLayer.addChild(this.portraitSlot)

		this.portrait.anchor.set(0.5)
		this.portrait.scale.set(2.4)
		this.portrait.position.set(centre, y + portraitHeight / 2)
		this.detailsLayer.addChild(this.portrait)

		this.detailsName.anchor.y = 0.5
		this.detailsName.position.set(centre, DETAILS.nameY)
		this.detailsType.anchor.y = 0.5
		this.detailsType.position.set(centre, DETAILS.typeY)
		// The catch tally is a footer: a hairline across the card, then the line
		// centred in the strip under it. Anchored on its glyphs, so the row sits in
		// the middle of the strip instead of on top of it.
		const footerTop = height - DETAILS.footer
		this.footerRule
			.rect(pad, footerTop, width - pad * 2, 1)
			.fill({ color: UI.periwinkle, alpha: 0.3 })
		anchorInk(this.detailsRecord, 'left', 'center')
		this.detailsRecord.position.set(pad, footerTop + DETAILS.footer / 2)
		this.footerRule.visible = false

		const rule = new Graphics()
		rule.rect(pad, DETAILS.ruleY, width - pad * 2, 1).fill({
			color: UI.periwinkle,
			alpha: 0.35
		})
		this.detailsLayer.addChild(rule)

		// The blurb is wrapped, so its box height changes with the number of lines;
		// pinning the box top put the first line further from the rule whenever the
		// copy ran longer. The caps are pinned instead, one `bodyGap` under the
		// rule, which is what the eye reads as the block's inset.
		this.detailsDesc.position.set(
			pad,
			DETAILS.ruleY + DETAILS.bodyGap - inkTopInset(this.detailsDesc)
		)
		this.detailsLayer.addChild(
			this.detailsName,
			this.detailsType,
			this.footerRule,
			this.detailsRecord,
			this.detailsDesc
		)
	}

	protected selectArea(area: AreaDef): void {
		this.area = area
		this.tabs.setSelected(AREAS.indexOf(area))
		// The outline belongs to one roster: switching tabs starts it on the new
		// grid's first entry instead of flying it across the gutter.
		this.hideSelection()

		// Every area grid is built once; switching only toggles visibility, so no
		// Text/Button objects are destroyed or re-rasterized on a tab click.
		for (const [id, layer] of this.gridContainers) {
			layer.visible = id === area.id
		}
		this.cells = this.cellsByArea.get(area.id) ?? []
		this.mode = 'grid'
		// Opening the codex must not outline the first fish: the ring is a keyboard
		// affordance and appears on the first arrow key. Once the player is
		// navigating, switching tabs keeps the ring on the new grid.
		const keyboard = this.focus.keyboardActive
		this.focus.setItems(
			this.cells.map((cell) => cell.button),
			this.L.GRID.columns
		)
		if (keyboard) this.focus.focus(0)
		else this.focus.select(0)
		// The card is never empty: it opens on the first species of the water body,
		// and the roster keeps the same entry marked.
		const first = this.cells[0]
		if (first) this.showDetails(first)
	}

	protected cycleArea(delta: number): void {
		const index = AREAS.indexOf(this.area)
		const next = (index + delta + AREAS.length) % AREAS.length
		this.selectArea(AREAS[next])
		this.game.audio.hover()
	}

	/** Marks the roster entry whose details the card is showing. */
	protected markSelection(cell: Cell): void {
		this.selection.aim({
			x: cell.button.x,
			y: cell.button.y,
			w: cell.w,
			h: cell.h
		})
	}

	/** Drops the outline, so the next {@link markSelection} starts in place. */
	protected hideSelection(): void {
		this.selection.hide()
	}

	handleKey(event: KeyboardEvent): boolean {
		if (event.code === 'Escape' || event.code === 'Backspace') {
			this.game.audio.back()
			this.onClose()
			return true
		}

		if (event.code === 'Tab') {
			this.mode = this.mode === 'tabs' ? 'grid' : 'tabs'
			if (this.mode === 'grid') {
				this.focus.focus(0)
				this.showFocusedDetails()
			}
			return true
		}

		if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
			if (this.mode === 'tabs') {
				this.cycleArea(-1)
				return true
			}
		}
		if (event.code === 'ArrowRight' || event.code === 'KeyD') {
			if (this.mode === 'tabs') {
				this.cycleArea(1)
				return true
			}
		}

		if (this.mode === 'tabs') {
			if (event.code === 'ArrowDown' || event.code === 'Enter') {
				this.mode = 'grid'
				this.focus.focus(0)
				this.showFocusedDetails()
			}
			return true
		}

		if (event.code === 'ArrowUp') {
			if (this.focus.currentIndex < this.L.GRID.columns) {
				this.mode = 'tabs'
				return true
			}
		}
		if (event.code === 'ArrowDown') {
			const next = this.focus.currentIndex + this.L.GRID.columns
			if (next >= this.cells.length) {
				this.mode = 'tabs'
				return true
			}
		}
		return this.focus.handleKey(event)
	}

	protected abstract buildGrids(): void
	protected abstract showDetails(cell: Cell): void
	protected abstract showFocusedDetails(): void
}
