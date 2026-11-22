import { Graphics } from 'pixi.js'
import { UI } from '../palette'

/** A frame the outline can sit on, in the grid's own pixels. */
export interface RingBox {
	x: number
	y: number
	w: number
	h: number
}

/**
 * The codex roster's outline: one element for the whole grid instead of a state
 * of each cell.
 *
 * It used to be a stroke repainted inside the hovered slot, which meant the
 * highlight appeared and vanished in place and the cell's own frame grew a
 * second edge while the pointer was over it. A single frame drawn over the grid
 * lines keeps the slots' own styling intact while the pointer moves.
 *
 * The frame is placed on the slot under the pointer in the same frame, with no
 * travel: a glide between cells read as lag on a sweep and left the card on the
 * right answering a cell the outline had not reached yet.
 */
export class SelectionRing extends Graphics {
	/** Puts the outline on a cell, in the same frame as the hover that aimed it. */
	aim(box: RingBox): void {
		const x = Math.round(box.x)
		const y = Math.round(box.y)
		const w = Math.round(box.w)
		const h = Math.round(box.h)
		this.clear()
		// The dark lip outside the ice line is what keeps it readable on a pale
		// caught slot as well as on the dark one next to it.
		this.rect(x - 1, y - 1, w + 2, h + 2).stroke({
			width: 1,
			color: UI.ink,
			alpha: 0.45,
			alignment: 0
		})
		this.rect(x, y, w, h).stroke({
			width: 1,
			color: UI.periwinkle,
			alignment: 0
		})
	}

	/** Drops the outline until the next {@link aim}. */
	hide(): void {
		this.clear()
	}
}
