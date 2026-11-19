import type { AreaDef } from '../../areas'
import type { FishSpecies } from '../../fish'
import { VIEW } from '../../config'
import { Button } from '../Button'
import { ICON_CONTROL, MAIN_TARGET, SECONDARY_TARGET, uiMetrics, type UiMetrics } from '../metrics'
import { PANEL_PAD, SCREEN_INSET } from '../theme'

/**
 * Geometry of the codex window, built for the input the player has.
 *
 * It used to be a set of module constants, which is exactly what a second size
 * for a finger cannot be: the tabs and the roster share one vertical rhythm, so
 * a taller tab bar has to push the roster down instead of drawing over it.
 * Nothing here moves on a fine pointer — the mouse branch reproduces the
 * numbers the window shipped with.
 */

export interface CodexPanelBox {
	x: number
	y: number
	width: number
	height: number
}

export interface CodexLayout {
	/** Side of the square close button in the title row. */
	closeSize: number
	PANEL: CodexPanelBox
	CONTENT: { left: number; right: number; width: number }
	TITLE: { x: number; y: number }
	TABS: CodexPanelBox
	GRID: {
		x: number
		y: number
		width: number
		height: number
		columns: number
		rows: number
		slots: number
		cellWidth: number
		cellHeight: number
	}
	DETAILS: {
		x: number
		y: number
		width: number
		height: number
		pad: number
		portrait: { y: number; width: number; height: number }
		nameY: number
		typeY: number
		ruleY: number
		bodyGap: number
		bodyLineHeight: number
		footer: number
	}
}

/** The window body holds a four-by-four roster and one entry card beside it. */
const COLUMNS = 4
const ROWS = 4
const GUTTER = 10
const ROSTER_SHARE = 0.6
/** Air between the header row and the first block under it. */
const HEADER_GAP = 8

function build(ui: UiMetrics): CodexLayout {
	const PANEL: CodexPanelBox = {
		x: SCREEN_INSET,
		y: SCREEN_INSET,
		width: VIEW.width - SCREEN_INSET * 2,
		height: VIEW.height - SCREEN_INSET * 2
	}
	const CONTENT = {
		left: PANEL.x + PANEL_PAD,
		right: PANEL.x + PANEL.width - PANEL_PAD,
		width: PANEL.width - PANEL_PAD * 2
	}
	const TITLE = { x: CONTENT.left, y: PANEL.y + PANEL_PAD }

	// The roster column, and the tabs that share its width so the two read as one
	// column instead of a bar floating over a wider grid.
	const rosterWidth = Math.round((CONTENT.width - GUTTER) * ROSTER_SHARE)

	// On a finger the close is an icon control like the HUD pair: same size, so
	// its 16 px tile lands on the same pixel step as their marks. A window's own
	// 18 px square is kept on a mouse, where the title row has no finger to serve.
	const closeSize = ui.pick(18, ui.target(ICON_CONTROL, MAIN_TARGET))
	const tabsHeight = ui.target(16, SECONDARY_TARGET)
	// Same row under the title as the help screen: the close button, then the
	// switcher under it. A taller close row on a phone pushes the tabs down.
	const tabsY = TITLE.y + closeSize + HEADER_GAP
	const bodyTop = tabsY + tabsHeight + HEADER_GAP
	const bodyBottom = PANEL.y + PANEL.height - PANEL_PAD

	const GRID = {
		x: CONTENT.left,
		y: bodyTop,
		width: rosterWidth,
		height: bodyBottom - bodyTop,
		columns: COLUMNS,
		rows: ROWS,
		slots: COLUMNS * ROWS,
		cellWidth: rosterWidth / COLUMNS,
		cellHeight: (bodyBottom - bodyTop) / ROWS
	}

	return {
		closeSize,
		PANEL,
		CONTENT,
		TITLE,
		TABS: {
			x: CONTENT.left,
			y: tabsY,
			width: rosterWidth,
			height: tabsHeight
		},
		GRID,
		DETAILS: {
			x: GRID.x + GRID.width + GUTTER,
			y: tabsY,
			width: CONTENT.width - GUTTER - GRID.width,
			height: bodyBottom - tabsY,
			pad: 8,
			portrait: { y: 8, width: 44, height: 40 },
			nameY: 58,
			typeY: 71,
			ruleY: 82,
			bodyGap: 6,
			// One step looser on a finger: the blurb is 10 px there (see
			// `CodexBase`), and a 10 px line box would set the lines on top of each
			// other. The desktop keeps the line it shipped with.
			bodyLineHeight: ui.pick(ui.font(9), 13),
			footer: 20
		}
	}
}

let cached: CodexLayout | null = null
let builtFor: UiMetrics | null = null

/** The layout for the current metrics, built once per session. */
export function codexLayout(): CodexLayout {
	const ui = uiMetrics()
	if (cached && builtFor === ui) return cached
	builtFor = ui
	cached = build(ui)
	return cached
}

export interface Cell {
	button: Button
	fish: FishSpecies
	area: AreaDef
	/** Cell frame in scene pixels: what the selection ring has to trace. */
	w: number
	h: number
}
