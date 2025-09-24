type CellId = number

export type MapCell = {
	id: CellId
	direction: 'left' | 'right' | 'up' | null
}

export type MainMap = {
	cellRows: MapCell[][]
	cells: MapCell[]
	startCell: MapCell
	finishCell: MapCell
}

export type Ladder = {
	cellFrom: CellId
	cellTo: CellId
}

export type Snake = {
	cellFrom: CellId
	cellTo: CellId
}

export const MapContainerId = 'map-container'

function generateMapCells() {
	const cellsAmount = 100
	const cellsInRow = 10
	const cells: MapCell[] = []

	let cellId = 1
	for (let i = 0; i < cellsAmount; i++) {
		cells[cellId] = { id: cellId, direction: 'right' }
		cellId++
	}

	const cellsReversed = cells.slice().reverse()
	const rows = []
	for (let i = 0; i < cellsAmount; i += cellsInRow) {
		let row = cellsReversed.slice(i, i + cellsInRow)
		// reverse every second row
		if (rows.length % 2 === 1) {
			row[0].direction = 'up'
			row = row.reverse()
		} else {
			for (let j = 0; j < cellsInRow; j++) {
				row[j].direction = 'left'
			}
			row[0].direction = 'up'
		}
		rows.push(row)
	}

	cells[100].direction = 'up'
	// cells[101].direction = 'up'
	return rows
}

const generatedMapCells = generateMapCells()
export const mapCellsSorted: Array<MapCell> = generatedMapCells.flat(1).sort((a, b) => a.id - b.id)
export const mapCellRows: Array<Array<MapCell>> = generatedMapCells

export const startCell = { id: 0, direction: 'up' } as MapCell
export const lastCell = { id: 101, direction: 'right' } as MapCell

export const getMapCellById = (id: number) => {
	if (id === 0) {
		return startCell
	}
	if (id === 101) {
		return lastCell
	}
	return mapCellsSorted[id - 1]
}

export const ladders: Array<Ladder> = [
	{ cellFrom: 1, cellTo: 20 },
	{ cellFrom: 4, cellTo: 25 },
	{ cellFrom: 13, cellTo: 46 },
	{ cellFrom: 33, cellTo: 49 },
	{ cellFrom: 42, cellTo: 63 },
	{ cellFrom: 44, cellTo: 68 },
	{ cellFrom: 50, cellTo: 69 },
	{ cellFrom: 62, cellTo: 81 },
	{ cellFrom: 71, cellTo: 90 },
	{ cellFrom: 74, cellTo: 92 }
]

export const laddersByCell = ladders.reduce(
	(acc, ladder) => {
		acc[ladder.cellFrom] = ladder
		return acc
	},
	{} as Record<number, Ladder>
)

export const snakes: Array<Snake> = [
	{ cellFrom: 21, cellTo: 3 },
	{ cellFrom: 27, cellTo: 5 },
	{ cellFrom: 43, cellTo: 18 },
	{ cellFrom: 47, cellTo: 11 },
	{ cellFrom: 54, cellTo: 31 },
	{ cellFrom: 66, cellTo: 45 },
	{ cellFrom: 76, cellTo: 58 },
	{ cellFrom: 89, cellTo: 53 },
	{ cellFrom: 94, cellTo: 67 },
	{ cellFrom: 96, cellTo: 84 },
	{ cellFrom: 97, cellTo: 85 },
	{ cellFrom: 99, cellTo: 41 }
]

export const snakesByCell = snakes.reduce(
	(acc, snake) => {
		acc[snake.cellFrom] = snake
		return acc
	},
	{} as Record<number, Snake>
)

export const CellSize = 121

export type CellPosition = {
	x: number
	y: number
	x1: number
	y1: number
}

const Cell100X = 244
const Cell100Y = 513

const Cell100Coords: CellPosition = {
	x: Cell100X,
	y: Cell100Y,
	x1: Cell100X + CellSize,
	y1: Cell100Y + CellSize
}

export function getCellPosition(cellId: number): CellPosition {
	if (cellId === 0) {
		const cell1Pos = getCellPosition(1)
		return {
			x: cell1Pos.x,
			y: cell1Pos.y + CellSize,
			x1: cell1Pos.x1,
			y1: cell1Pos.y1 + CellSize
		}
	}

	const cellRow = Math.floor((cellId - 1) / 10)
	const cellCol = (cellId - 1) % 10
	const xRaw = cellRow % 2 === 0 ? cellCol * CellSize : (9 - cellCol) * CellSize
	const yRaw = (9 - cellRow) * CellSize

	const x = xRaw + Cell100Coords.x
	const y = yRaw + Cell100Coords.y

	return { x, y, x1: x + CellSize, y1: y + CellSize }
}
