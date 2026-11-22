import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { AREAS, type AreaDef } from '../../areas'
import { fishInArea, formatFlaw, isPlatinum, PEARLS } from '../../fish'
import { ShinyShader } from '../../game/shinyShader'
import { PlatinumShader } from '../../game/platinumShader'
import { PearlView } from '../../game/pearl/PearlView'
import { TEXT } from '../../texts'
import { UI } from '../palette'
import { makeText } from '../theme'
import { anchorInk } from '../textInk'
import { Button } from '../Button'
import { TapGuard } from '../tapSlop'
import type { AreaId } from '../../types'
import { CodexBase, type CodexCoat } from './CodexBase'
import { CONTACT_SHADOW, contactShadowFilter, makeContactShadow } from './contactShadow'
import type { Cell, CodexLayout, FishCell, PearlCell } from './setup'

/**
 * How far the numbers are lifted off the well's bottom rim, in pixels. They used
 * to be anchored on the rim itself, so the ink sat on the slot's lower border
 * and the whole cell read as cramped.
 */
const CAPTION_LIFT = 5

/**
 * The left half of the split: a 4×4 roster of wells.
 *
 * A slot is a picture, not a label — the name, the rarity dot, the weight and the
 * «???» of an unseen species are all gone: the fish stands in its contact shadow
 * and the only number left in the well is the catch tally. The species name and
 * the two ends of its record are the entry card's job on the right. Lake and river
 * have twelve species, so the remaining four wells are drawn empty on purpose.
 *
 * The one thing the picture itself carries is the coat: a species whose shiny
 * specimen has been landed runs the rainbow shader in its well, and a completed
 * species gets the platinum shader on the well itself — an icy sweep over the
 * plate, never over the fish, so the rainbow keeps its colours.
 */
export abstract class CodexGrid extends CodexBase {
	/** Roster block of the current size profile. */
	private get grid(): CodexLayout['GRID'] {
		return this.L.GRID
	}

	/**
	 * Ticks the shine of the open tab. The pearl tab animates its shader views;
	 * the fish tabs animate the coats of their wells and sprites — the rainbow on
	 * a shiny specimen and the platinum plate under a completed one — and only
	 * the visible tab is advanced.
	 *
	 * The slots are walked instead of kept in a list where they are built during
	 * the base constructor, before this class's own fields exist.
	 */
	update(dt: number): void {
		const layer = this.gridContainers.get('pearls')
		if (layer?.visible === true) this.tickShine(layer, dt)
		if (this.tab !== 'pearls') {
			for (const coat of this.rosterCoats.get(this.tab) ?? []) coat.advance(dt)
		}
	}

	private tickShine(node: Container, dt: number): void {
		for (const child of node.children) {
			if (child instanceof PearlView) child.advance(dt)
			else if (child instanceof Container) this.tickShine(child, dt)
		}
	}

	protected buildGrids(): void {
		for (const area of AREAS) {
			const layer = new Container()
			layer.visible = false
			this.gridLayer.addChild(layer)
			const cells = this.buildAreaGrid(area, layer)
			this.gridContainers.set(area.id, layer)
			this.cellsByTab.set(area.id, cells)
		}
		this.buildPearlGrid()
	}

	/** The fourth tab: twelve varieties, four wells left empty like the lake. */
	private buildPearlGrid(): void {
		const layer = new Container()
		layer.visible = false
		this.gridLayer.addChild(layer)
		const cells: PearlCell[] = []

		PEARLS.forEach((pearl, index) => {
			const column = index % this.grid.columns
			const row = Math.floor(index / this.grid.columns)
			const { x, y, w: width, h: height } = this.cellBox(column, row)
			const button = new Button({ width, height, variant: 'ghost', bare: true })
			button.position.set(x, y)

			const entry = this.game.progress.snapshot.pearls[pearl.id]
			const caught = (entry?.caught ?? 0) > 0
			button.addChild(this.paintSlot(width, height, caught, false))

			// A caught variety runs the shader in its well: the shelf shows what
			// each pearl actually looks like, index and all. An unfound one stays a
			// flat ink silhouette — there is no specimen to shine yet.
			if (caught && entry) {
				button.addChild(this.shadowFor(this.game.assets.pearls[pearl.id], width, height, 1.35))
				const icon = new PearlView(this.game.assets.pearls[pearl.id])
				icon.setPearl(entry.best, pearl.grade)
				// 16 px pearl art at 1.35 reads the same size as a 16 px fish at 1.3.
				icon.scale.set(1.35)
				icon.position.set(width / 2, height / 2)
				icon.eventMode = 'none'
				button.addChild(icon)
			} else {
				const icon = new Sprite(this.game.assets.pearls[pearl.id])
				icon.anchor.set(0.5)
				icon.scale.set(1.35)
				icon.position.set(width / 2, height / 2)
				icon.eventMode = 'none'
				icon.tint = UI.ink
				icon.alpha = 0.92
				button.addChild(icon)
			}

			if (caught && entry) {
				this.addCaption(button, formatFlaw(entry.best.float), entry.caught, width, height, false)
			}

			const cell: PearlCell = { kind: 'pearl', button, pearl, w: width, h: height }
			this.bindCell(button, cell, layer)
			cells.push(cell)
		})

		this.buildEmptySlots(layer, PEARLS.length)
		this.paintGridLines(layer)
		this.gridContainers.set('pearls', layer)
		this.cellsByTab.set('pearls', cells)
	}

	/**
	 * Box of one well inside the roster block. Cells are flush: the grid's
	 * hairlines are drawn as one set of lines over them (see
	 * {@link paintGridLines}), so a cell has no frame of its own and two
	 * neighbours share the line between them instead of each drawing one.
	 */
	private cellBox(
		column: number,
		row: number
	): {
		x: number
		y: number
		w: number
		h: number
	} {
		return {
			x: this.grid.x + column * this.grid.cellWidth,
			y: this.grid.y + row * this.grid.cellHeight,
			w: this.grid.cellWidth,
			h: this.grid.cellHeight
		}
	}

	protected buildAreaGrid(area: AreaDef, layer: Container): FishCell[] {
		const cells: FishCell[] = []
		const roster = fishInArea(area.id)

		roster.forEach((fish, index) => {
			const column = index % this.grid.columns
			const row = Math.floor(index / this.grid.columns)
			const { x, y, w: width, h: height } = this.cellBox(column, row)
			// Bare: the roster cell is an input surface only. Its fill is drawn below
			// and its frame comes from the shared line layer, so hovering never paints
			// a second, thicker edge over the grid.
			const button = new Button({
				width,
				height,
				variant: 'ghost',
				bare: true
			})
			button.position.set(x, y)

			const entry = this.fishEntry(fish)
			const caught = (entry?.caught ?? 0) > 0
			const platinum = isPlatinum(entry, fish.tier)
			const slot = this.paintSlot(width, height, caught, platinum)
			button.addChild(slot)
			if (platinum) this.addPlatinumPlate(slot, area.id, width, height)

			const icon = new Sprite(this.game.assets.fish[fish.id])
			icon.anchor.set(0.5)
			icon.scale.set(1.3)
			// Dead centre of the well: the picture is the slot's subject and must not
			// drift to make room for the numbers.
			icon.position.set(width / 2, height / 2)
			icon.eventMode = 'none'
			if (!caught) {
				icon.tint = UI.ink
				icon.alpha = 0.92
			} else {
				button.addChild(this.shadowFor(this.game.assets.fish[fish.id], width, height, 1.3))
				if (entry?.shiny) {
					// The landed shiny specimen keeps the coat in the well: the slot then
					// shows the rarest thing the player has of this species, not just that
					// the species is known. Platinum does not touch the sprite: it dresses
					// the plate instead (see `addPlatinumPlate`).
					this.addShinyCoat(icon, area.id)
				}
			}
			button.addChild(icon)

			if (caught && entry) {
				// The weights live on the entry card; a well keeps only the tally.
				this.addCaption(button, null, entry.caught, width, height, platinum)
			}

			const cell: FishCell = { kind: 'fish', button, fish, area, w: width, h: height }
			this.bindCell(button, cell, layer)
			cells.push(cell)
		})

		this.buildEmptySlots(layer, roster.length)
		this.paintGridLines(layer)
		return cells
	}

	/**
	 * The well: one flush socket per entry. Its frame is the grid's, not its own
	 * — a per-cell stroke made the outside of the roster two pixels thick while
	 * the seams inside it stayed one. The socket's own styling is drawn one pixel
	 * in from that frame, so it never doubles the edge: an ink lip along the top
	 * and left where the well sits under the plate, and a cold highlight along
	 * the bottom and right where the light catches it. It is the same sunken
	 * treatment the panels use for their inner bevel.
	 *
	 * A platinum well inverts the plate: the whole socket is a bright ice surface
	 * with the bevel shaded on the far edge, so the slot itself reads as platinum
	 * — a frame around a dark well only looked like a focused cell.
	 */
	private paintSlot(width: number, height: number, caught: boolean, platinum: boolean): Graphics {
		const slot = new Graphics()
		if (platinum) {
			slot.rect(0, 0, width, height).fill({ color: UI.periwinklePale, alpha: 0.92 })
			slot.rect(1, 1, width - 2, 1).fill({ color: UI.primary, alpha: 0.9 })
			slot.rect(1, 1, 1, height - 2).fill({ color: UI.primary, alpha: 0.9 })
			slot.rect(1, height - 2, width - 2, 1).fill({ color: UI.ink, alpha: 0.28 })
			slot.rect(width - 2, 1, 1, height - 2).fill({ color: UI.ink, alpha: 0.22 })
			slot.eventMode = 'none'
			return slot
		}
		const well = caught ? { color: UI.panelAlt, alpha: 0.34 } : { color: UI.surface, alpha: 0.5 }
		slot.rect(0, 0, width, height).fill(well)
		slot.rect(1, 1, width - 2, 1).fill({ color: UI.ink, alpha: caught ? 0.32 : 0.24 })
		slot.rect(1, 1, 1, height - 2).fill({ color: UI.ink, alpha: caught ? 0.2 : 0.16 })
		slot
			.rect(1, height - 2, width - 2, 1)
			.fill({ color: UI.periwinklePale, alpha: caught ? 0.18 : 0.14 })
		slot
			.rect(width - 2, 1, 1, height - 2)
			.fill({ color: UI.periwinklePale, alpha: caught ? 0.09 : 0.07 })
		slot.eventMode = 'none'
		return slot
	}

	/**
	 * The well's corner items: the catch count on the right, and on the left a
	 * pearl's flaw index — the one number the roster has no card line for. A fish
	 * leaves the left corner empty: its weights are on the entry card, and the
	 * well already shows the record by the species' own picture.
	 *
	 * On a platinum well the copy has to flip to ink: the socket is a bright plate
	 * there, and the muted blue of the normal corner would vanish on it.
	 */
	private addCaption(
		button: Button,
		left: string | null,
		count: number,
		width: number,
		height: number,
		platinum: boolean
	): void {
		const bottom = height - CAPTION_LIFT
		if (left !== null) {
			const record = makeText(left, {
				size: this.game.ui.font(6.5),
				color: platinum ? UI.textOnBright : UI.textMuted
			})
			anchorInk(record, 'left', 'bottom')
			record.position.set(4, bottom)
			record.eventMode = 'none'
			button.addChild(record)
		}

		const tally = makeText(TEXT.codex.slotCount(count), {
			size: this.game.ui.font(6.5),
			color: platinum ? UI.textOnBright : UI.text
		})
		anchorInk(tally, 'right', 'bottom')
		tally.position.set(width - 4, bottom)
		tally.eventMode = 'none'
		button.addChild(tally)
	}

	/**
	 * Contact shadow of a well's sprite: a blurred ink copy of it, added before
	 * the sprite so it lies behind it on the plate.
	 */
	private shadowFor(texture: Texture, width: number, height: number, scale: number): Sprite {
		const filter = contactShadowFilter()
		this.shadowFilters.push(filter)
		const shadow = makeContactShadow(texture, filter)
		shadow.scale.set(scale)
		shadow.position.set(width / 2, height / 2 + CONTACT_SHADOW.offsetY)
		return shadow
	}

	/**
	 * Puts the rainbow coat on one roster sprite and files its clock under the
	 * tab that owns it, so only the visible tab keeps advancing.
	 */
	private addShinyCoat(sprite: Sprite, areaId: AreaId): void {
		const rainbow = new ShinyShader()
		sprite.filters = [rainbow.filter]
		this.fileCoat(areaId, rainbow)
	}

	/**
	 * Dresses the well itself in platinum and files the plate's clock under its
	 * tab.
	 *
	 * The filter goes on the slot Graphics, not on the fish: the plate is what
	 * turns platinum, and the sprite keeps the rainbow untouched. That is also
	 * why the two shaders cannot fight — they never paint the same pixels.
	 */
	private addPlatinumPlate(slot: Graphics, areaId: AreaId, width: number, height: number): void {
		const plate = new PlatinumShader(width, height)
		slot.filters = [plate.filter]
		this.fileCoat(areaId, plate)
	}

	/** Registers a coat's clock with the tab that must advance it. */
	private fileCoat(areaId: AreaId, coat: CodexCoat): void {
		const list = this.rosterCoats.get(areaId)
		if (list) list.push(coat)
		else this.rosterCoats.set(areaId, [coat])
	}

	/**
	 * Both open the entry card. Leaving the cell keeps the last entry: the card
	 * is a fixed pane, and blanking it on every pointer move made the whole right
	 * half of the window flicker. On a finger the card follows the tap, and a
	 * drag across the roster picks nothing.
	 */
	private bindCell(button: Button, cell: Cell, layer: Container): void {
		const tap = new TapGuard()
		button.on('pointerdown', (event) => {
			tap.start(event.global.x, event.global.y)
		})
		button.on('pointertap', (event) => {
			if (tap.end(event.global.x, event.global.y)) this.showDetails(cell)
		})
		button.on('pointerover', (event) => {
			if (event.pointerType === 'touch') return
			this.showDetails(cell)
		})
		layer.addChild(button)
	}

	/**
	 * The roster's frame: the same one-pixel line for the outside edge and for
	 * every seam inside it.
	 *
	 * It used to be each well's own stroke, inset by a two-pixel seam. At the
	 * border of the block that seam read as a second, darker band on top of the
	 * stroke, so the roster looked framed twice as heavily outside as inside.
	 * Drawing the lines once, after the sockets, makes every edge exactly one
	 * pixel and gives the sliding outline one grid to travel over.
	 */
	private paintGridLines(layer: Container): void {
		const lines = new Graphics()
		const x0 = this.grid.x
		const y0 = this.grid.y
		const width = this.grid.columns * this.grid.cellWidth
		const height = this.grid.rows * this.grid.cellHeight
		const style = { color: UI.ink, alpha: 0.55 }

		// The outer frame sits on the boundary *after* the last cell, so the last
		// vertical line has to carry one extra pixel down to the bottom frame. It
		// did not, and the block's bottom-right corner was the one place where the
		// two lines never met. Only that line grows: a longer interior seam would
		// lay a second fill over the bottom frame and print a darker dot at every
		// column.
		for (let column = 0; column <= this.grid.columns; column += 1) {
			// Rounding keeps every seam on the pixel grid even when the roster width
			// is not a multiple of four.
			const x = Math.round(x0 + column * this.grid.cellWidth)
			const reach = column === this.grid.columns ? height + 1 : height
			lines.rect(x, y0, 1, reach).fill(style)
		}
		for (let row = 0; row <= this.grid.rows; row += 1) {
			const y = Math.round(y0 + row * this.grid.cellHeight)
			lines.rect(x0, y, width, 1).fill(style)
		}
		lines.eventMode = 'none'
		layer.addChild(lines)
	}

	/** Wells past the end of the roster, so a short roster still fills the grid. */
	private buildEmptySlots(layer: Container, filled: number): void {
		for (let index = filled; index < this.grid.slots; index += 1) {
			const column = index % this.grid.columns
			const row = Math.floor(index / this.grid.columns)
			const { x, y, w: width, h: height } = this.cellBox(column, row)

			const empty = new Graphics()
			empty.rect(x, y, width, height).fill({ color: UI.ink, alpha: 0.22 })
			// The same sunken lip as a filled socket, one pixel inside the grid line.
			empty.rect(x + 1, y + 1, width - 2, 1).fill({ color: UI.ink, alpha: 0.18 })
			empty
				.rect(x + 1, y + height - 2, width - 2, 1)
				.fill({ color: UI.periwinklePale, alpha: 0.07 })
			// A short dash instead of a picture: the well reads as "nothing here".
			empty.rect(x + width / 2 - 4, y + height / 2, 8, 1).fill({ color: UI.periwinkle, alpha: 0.2 })
			empty.eventMode = 'none'
			layer.addChild(empty)
		}
	}
}
