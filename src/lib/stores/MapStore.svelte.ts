import { LastMapPosition } from '$lib/constants'
import type { CellPosition } from '$lib/mapUtils'

const BaseCellSize = 121
const BaseCell100X = 244
const BaseCell100Y = 513

export class MapStore {
	// scale2 = $state(1)
	scale = $state(1)

	cellSize = $derived(BaseCellSize * this.scale)
	cell100X = $derived(BaseCell100X * this.scale)
	cell100Y = $derived(BaseCell100Y * this.scale)

	cell100Position = $derived({
		x: this.cell100X,
		y: this.cell100Y,
		x1: this.cell100X + this.cellSize,
		y1: this.cell100Y + this.cellSize
	})

	cellPositionById = $derived.by(() => {
		const positions: Record<number, CellPosition> = {}
		// Loop up to LastMapPosition + 1 (102) to include the special completed/winner cell position
		for (let i = 0; i <= LastMapPosition + 1; i++) {
			positions[i] = calculateCellPosition({
				cellId: i,
				cellSize: this.cellSize,
				cell100Pos: this.cell100Position
			})
		}
		return positions
	})
}

function calculateCellPosition({
	cellId,
	cellSize,
	cell100Pos
}: {
	cellId: number
	cellSize: number
	cell100Pos: CellPosition
}): CellPosition {
	if (cellId === 102) {
		// count winner offset from 0,0
		return { x: 0, y: 0, x1: 0, y1: 0 }
	}
	if (cellId === 0) {
		const cell1Pos = calculateCellPosition({ cellId: 1, cellSize, cell100Pos })
		return {
			x: cell1Pos.x,
			y: cell1Pos.y + cellSize,
			x1: cell1Pos.x1,
			y1: cell1Pos.y1 + cellSize
		}
	}
	if (cellId === LastMapPosition) {
		return {
			x: cell100Pos.x,
			y: cell100Pos.y - cellSize,
			x1: cell100Pos.x1,
			y1: cell100Pos.y1 - cellSize
		}
	}

	const cellRow = Math.floor((cellId - 1) / 10)
	const cellCol = (cellId - 1) % 10
	const xRaw = cellRow % 2 === 0 ? cellCol * cellSize : (9 - cellCol) * cellSize
	const yRaw = (9 - cellRow) * cellSize

	const x = xRaw + BaseCell100X
	const y = yRaw + BaseCell100Y

	return { x, y, x1: x + cellSize, y1: y + cellSize }
}
