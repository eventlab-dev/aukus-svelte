import {
	Container,
	Graphics,
	Sprite,
	Text,
	Texture,
	type BlurFilter,
	type DestroyOptions
} from 'pixi.js'
import type { GameContext } from '../../GameContext'
import { AREAS } from '../../areas'
import { CODEX_TAB_LABEL, TEXT } from '../../texts'
import type { AreaId, FishProgress } from '../../types'
import type { FishSpecies } from '../../fish'
import { Button } from '../Button'
import { FocusGroup } from '../FocusGroup'
import { UI } from '../palette'
import { drawPanel, makeText, setText } from '../theme'
import { anchorInk, inkAnchorY, inkTopInset, inkWidth } from '../textInk'
import { iconSteps } from '../metrics'
import { CodexTabs } from './CodexTabs'
import { CONTACT_SHADOW, contactShadowFilter, makeContactShadow } from './contactShadow'
import { devPlatinumPreview } from './devPreview'
import { SelectionRing } from './selectionRing'
import { codexLayout, type Cell, type CodexLayout } from './setup'

/** One line of the entry card's stat block: a muted label and its value. */
export interface FooterRow {
	label: string
	value: string
}

/** Three water bodies plus the pearl collection. */
export type CodexTabId = AreaId | 'pearls'

/**
 * A coat that keeps its own clock: the rainbow of a shiny sprite or the platinum
 * of a completed well. The codex only advances the coats of the tab that is on
 * screen, so a hidden roster costs nothing.
 */
export interface CodexCoat {
	advance(dt: number): void
	destroy(): void
}

const TAB_ORDER: readonly CodexTabId[] = [...AREAS.map((area) => area.id), 'pearls']
const TAB_LABELS: readonly string[] = [
	...AREAS.map((area) => CODEX_TAB_LABEL[area.id]),
	TEXT.codex.pearlTab
]

/**
 * The entry card's stat block: a boxed list under the blurb, one fact per row.
 * The rows are text only — no marks: a labelled value is enough, and a glyph in
 * a 6 px line read as a bullet rather than as a fact. Three is the most any card
 * prints: a fish stops at both weight ends and its tally, a pearl at its flaw,
 * size and finds.
 */
const FOOTER_ROWS = 3
/**
 * Air between a row's label and its value, in pixels.
 *
 * The value follows its own label, not a column: the rows are read one at a time
 * ("what is the smallest I have caught?") and a column of numbers turns the block
 * into a table nobody asked for.
 */
const FOOTER_VALUE_GAP = 3

export abstract class CodexBase extends Container {
	protected readonly game: GameContext
	protected readonly onClose: () => void
	/** Window geometry for this input; see `codex/setup.ts`. */
	protected readonly L: CodexLayout
	protected tabs!: CodexTabs
	protected readonly focus = new FocusGroup()
	protected cells: Cell[] = []
	protected readonly cellsByTab = new Map<CodexTabId, Cell[]>()
	protected readonly gridContainers = new Map<CodexTabId, Container>()
	/**
	 * Entries the codex shows instead of the saved ones. Only the dev platinum
	 * preview writes here; the saved document is never touched.
	 */
	protected readonly previewEntries = new Map<string, FishProgress>()
	protected tab: CodexTabId
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
	/** The box of the stat block: its fill and its frame. */
	private readonly footerBox = new Graphics()
	/** Contact shadow of the portrait, restated per entry. */
	private readonly portraitBlur = contactShadowFilter(true)
	private readonly portraitShadow = makeContactShadow(Texture.EMPTY, this.portraitBlur)
	/** Blur filters of the roster shadows, owned so they can be released on close. */
	protected readonly shadowFilters: BlurFilter[] = []
	protected readonly portrait = new Sprite()

	/** Coats of the roster slots, grouped by the tab that owns them. */
	protected readonly rosterCoats = new Map<AreaId, CodexCoat[]>()
	/** Header, right column: the name over the rarity. */
	protected readonly detailsName: Text
	protected readonly detailsType: Text
	/** The stat block's rows: a muted label and a bright value per line. */
	private readonly footerLabels: Text[] = []
	private readonly footerValues: Text[] = []
	protected readonly detailsDesc: Text
	/** Top of the stat block inside the card, in card coordinates. */
	private footerTop = 0
	private readonly wrap: number

	constructor(game: GameContext, initialAreaId: AreaId, onClose: () => void) {
		super()
		this.game = game
		this.onClose = onClose
		this.L = codexLayout()
		this.tab = initialAreaId
		const preview = devPlatinumPreview(initialAreaId, game.progress.snapshot)
		if (preview) this.previewEntries.set(preview.fishId, preview.entry)

		const ui = game.ui
		this.wrap = this.L.DETAILS.width - this.L.DETAILS.pad * 2
		const rowSize = this.L.DETAILS.footer.text
		this.detailsName = makeText('', {
			size: ui.font(10),
			weight: 800,
			color: UI.text,
			align: 'left'
		})
		this.detailsType = makeText('', {
			size: ui.font(6.5),
			color: UI.textMuted,
			align: 'left'
		})
		for (let index = 0; index < FOOTER_ROWS; index += 1) {
			// The label is the muted half of the row, the value the readable one: the
			// eye scans for numbers, not for the words that name them.
			this.footerLabels.push(
				makeText('', {
					size: rowSize,
					color: UI.textMuted
				})
			)
			this.footerValues.push(
				makeText('', {
					size: rowSize,
					weight: 800,
					color: UI.text
				})
			)
		}
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
		this.selectTab(this.tab)
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
			labels: TAB_LABELS,
			width: TABS.width,
			height: TABS.height,
			fontSize: this.game.ui.font(8),
			onPick: (index) => {
				this.game.audio.click()
				this.selectTab(TAB_ORDER[index])
			},
			onHover: () => this.game.audio.hover()
		})
		this.tabs.position.set(TABS.x, TABS.y)
		this.addChild(this.tabs)

		this.focus.onMove = () => this.showFocusedDetails()
	}

	/**
	 * The entry card is built once: a dark plate (the same ink the old floating
	 * tooltip used), a two-column header — the sprite's well on the left, the name
	 * and the rarity beside it — the species blurb, and three stat rows under a
	 * hairline. Only the text changes as the pointer moves, so hovering the roster
	 * never re-rasterizes a panel.
	 */
	protected buildDetails(): void {
		const DETAILS = this.L.DETAILS
		const { width, height, pad, portrait, name, type: typeLine, ruleY } = DETAILS
		this.detailsLayer.position.set(DETAILS.x, DETAILS.y)
		this.detailsLayer.eventMode = 'none'

		drawPanel(this.detailsPanel, 0, 0, width, height, {
			fill: UI.ink,
			alpha: 0.55
		})
		this.detailsLayer.addChild(this.detailsPanel)

		// A lighter well behind the fish: an uncaught species is drawn as a black
		// silhouette and would vanish straight into the ink of the card.
		this.portraitSlot
			.rect(portrait.x, portrait.y, portrait.width, portrait.height)
			.fill({ color: UI.surface, alpha: 0.5 })
		this.detailsLayer.addChild(this.portraitSlot)

		this.portrait.anchor.set(0.5)
		this.portrait.scale.set(2.4)
		this.portrait.position.set(portrait.x + portrait.width / 2, portrait.y + portrait.height / 2)
		// Under the portrait: the shadow is repainted by `syncPortraitShadow`, and
		// an entry that is still a silhouette leaves it empty.
		this.detailsLayer.addChild(this.portraitShadow, this.portrait)

		anchorInk(this.detailsName, 'left', 'center')
		this.detailsName.position.set(name.x, name.y)
		anchorInk(this.detailsType, 'left', 'center')
		this.detailsType.position.set(typeLine.x, typeLine.y)

		// The stat block is a boxed list, not a strip under a hairline: a fill and a
		// one-pixel frame make it one block with the rest of the card. Its box is
		// painted per entry by `setFooter`, since it hugs the rows it holds.
		this.footerBox.visible = false
		this.footerLabels.forEach((label, index) => {
			anchorInk(label, 'left', 'center')
			anchorInk(this.footerValues[index], 'left', 'center')
			label.visible = false
			this.footerValues[index].visible = false
		})

		const rule = new Graphics()
		rule.rect(pad, ruleY, width - pad * 2, 1).fill({
			color: UI.periwinkle,
			alpha: 0.35
		})
		this.detailsLayer.addChild(rule)

		// The blurb is wrapped, so its box height changes with the number of lines;
		// pinning the box top put the first line further from the rule whenever the
		// copy ran longer. The caps are pinned instead, one `bodyGap` under the
		// rule, which is what the eye reads as the block's inset.
		this.detailsDesc.position.set(pad, ruleY + DETAILS.bodyGap - inkTopInset(this.detailsDesc))
		this.detailsLayer.addChild(
			this.detailsName,
			this.detailsType,
			this.footerBox,
			...this.footerLabels,
			...this.footerValues,
			this.detailsDesc
		)
	}

	/**
	 * Fills the stat block.
	 *
	 * Each row is one line of copy: a muted label and its value right after it,
	 * separated by {@link FOOTER_VALUE_GAP} of air — a sentence, not a two-column
	 * table. The box itself is measured from the rows — one `pad` above the first
	 * capitals, below the last and on both sides — so the block hugs the rows it
	 * holds instead of being a strip with an empty half. Rows that are not passed
	 * stay hidden, and an empty block hides its box too.
	 */
	protected setFooter(rows: readonly FooterRow[]): void {
		const { width, height, pad, footer } = this.L.DETAILS
		this.footerBox.clear()
		this.footerBox.visible = rows.length > 0
		this.footerLabels.forEach((label, index) => {
			const row = rows[index]
			const visible = row !== undefined
			label.visible = visible
			this.footerValues[index].visible = visible
			if (!visible) return
			setText(label, row.label)
			setText(this.footerValues[index], row.value)
		})
		if (rows.length === 0) return

		// The air above the capitals inside one line box: the box is measured from
		// the ink, not from the line box, so the four paddings look the same.
		const line = this.footerLabels[0]
		const capHalf = inkAnchorY(line) * line.height - inkTopInset(line)
		const boxHeight = Math.round(footer.pad * 2 + (rows.length - 1) * footer.rowGap + capHalf * 2)
		const boxTop = height - footer.margin - boxHeight
		const boxWidth = width - pad * 2
		this.footerBox.rect(pad, boxTop, boxWidth, boxHeight).fill({ color: UI.ink, alpha: 0.38 })
		const border = { color: UI.periwinkle, alpha: 0.26 }
		this.footerBox.rect(pad, boxTop, boxWidth, 1).fill(border)
		this.footerBox.rect(pad, boxTop + boxHeight - 1, boxWidth, 1).fill(border)
		this.footerBox.rect(pad, boxTop, 1, boxHeight).fill(border)
		this.footerBox.rect(pad + boxWidth - 1, boxTop, 1, boxHeight).fill(border)

		const left = pad + footer.pad
		const firstY = boxTop + footer.pad + capHalf
		for (let index = 0; index < rows.length; index += 1) {
			const y = firstY + index * footer.rowGap
			const label = this.footerLabels[index]
			label.position.set(left, y)
			// The value rides on its own label's ink: no column to align to, so the
			// line reads left to right the way the sentence does.
			this.footerValues[index].position.set(left + inkWidth(label) + FOOTER_VALUE_GAP, y)
		}
	}

	/**
	 * The entry the codex shows for a species: the saved record, or the dev
	 * preview that dresses the first slot as a finished one. Both the roster and
	 * the entry card read through here, so the plate and the numbers agree.
	 */
	protected fishEntry(fish: FishSpecies): FishProgress | undefined {
		return this.previewEntries.get(fish.id) ?? this.game.progress.snapshot.fish[fish.id]
	}

	/**
	 * Places the portrait's contact shadow behind it when the entry is shown
	 * whole: the silhouette of an uncaught species needs no copy behind it, it is
	 * ink already. The shadow follows the portrait's texture and scale, which
	 * change with every entry.
	 */
	protected syncPortraitShadow(revealed: boolean): void {
		const shadow = this.portraitShadow
		shadow.visible = revealed
		if (!revealed) return
		shadow.texture = this.portrait.texture
		shadow.scale.copyFrom(this.portrait.scale)
		shadow.position.set(this.portrait.x, this.portrait.y + CONTACT_SHADOW.offsetY)
	}

	protected selectTab(tab: CodexTabId): void {
		this.tab = tab
		this.tabs.setSelected(TAB_ORDER.indexOf(tab))
		// The outline belongs to one roster: switching tabs starts it on the new
		// grid's first entry instead of flying it across the gutter.
		this.hideSelection()

		// Every grid is built once; switching only toggles visibility, so no
		// Text/Button objects are destroyed or re-rasterized on a tab click.
		for (const [id, layer] of this.gridContainers) {
			layer.visible = id === tab
		}
		this.cells = this.cellsByTab.get(tab) ?? []
		this.mode = 'grid'
		// Opening the codex must not outline the first entry: the ring is a keyboard
		// affordance and appears on the first arrow key. Once the player is
		// navigating, switching tabs keeps the ring on the new grid.
		const keyboard = this.focus.keyboardActive
		this.focus.setItems(
			this.cells.map((cell) => cell.button),
			this.L.GRID.columns
		)
		if (keyboard) this.focus.focus(0)
		else this.focus.select(0)
		// The card is never empty: it opens on the first entry of the tab, and the
		// roster keeps the same entry marked.
		const first = this.cells[0]
		if (first) this.showDetails(first)
	}

	protected cycleTab(delta: number): void {
		const index = TAB_ORDER.indexOf(this.tab)
		const next = (index + delta + TAB_ORDER.length) % TAB_ORDER.length
		this.selectTab(TAB_ORDER[next])
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

	/**
	 * Releases every coat and the shadows' blurs. A container's destroy frees
	 * its children, not their filters, so they are released here or they stay in
	 * the renderer for the session.
	 */
	override destroy(options?: DestroyOptions | boolean): void {
		for (const coats of this.rosterCoats.values()) {
			for (const coat of coats) coat.destroy()
		}
		this.rosterCoats.clear()
		for (const filter of this.shadowFilters) filter.destroy()
		this.shadowFilters.length = 0
		this.portraitBlur.destroy()
		super.destroy(options)
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
				this.cycleTab(-1)
				return true
			}
		}
		if (event.code === 'ArrowRight' || event.code === 'KeyD') {
			if (this.mode === 'tabs') {
				this.cycleTab(1)
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
