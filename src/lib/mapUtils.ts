import { CDN_URL_BASE, LastMapPosition } from './constants'

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
export const lastCell = { id: LastMapPosition, direction: 'right' } as MapCell

export const getMapCellById = (id: number) => {
	if (id === 0) {
		return startCell
	}
	if (id === LastMapPosition) {
		return lastCell
	}
	return mapCellsSorted[id - 1]
}

export const ladders: Array<Ladder> = [
	{ cellFrom: 1, cellTo: 20 },
	{ cellFrom: 4, cellTo: 25 },
	{ cellFrom: 13, cellTo: 46 },
	{ cellFrom: 17, cellTo: 35 },
	{ cellFrom: 33, cellTo: 49 },
	{ cellFrom: 42, cellTo: 63 },
	{ cellFrom: 44, cellTo: 68 },
	{ cellFrom: 50, cellTo: 69 },
	{ cellFrom: 62, cellTo: 78 },
	{ cellFrom: 71, cellTo: 85 },
	{ cellFrom: 74, cellTo: 88 }
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
	{ cellFrom: 89, cellTo: 72 },
	{ cellFrom: 94, cellTo: 73 },
	{ cellFrom: 96, cellTo: 80 },
	{ cellFrom: 97, cellTo: 83 },
	{ cellFrom: 99, cellTo: 70 }
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
	if (cellId === 102) {
		// count winner offset from 0,0
		return { x: 0, y: 0, x1: 0, y1: 0 }
	}
	if (cellId === 0) {
		const cell1Pos = getCellPosition(1)
		return {
			x: cell1Pos.x,
			y: cell1Pos.y + CellSize,
			x1: cell1Pos.x1,
			y1: cell1Pos.y1 + CellSize
		}
	}
	if (cellId === LastMapPosition) {
		const cell100Pos = getCellPosition(100)
		return {
			x: cell100Pos.x,
			y: cell100Pos.y - CellSize,
			x1: cell100Pos.x1,
			y1: cell100Pos.y1 - CellSize
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

export function getWinnerPosition(place: number) {
	switch (place) {
		case 1:
			return { x: 870, y: 120 }
		case 2:
			return { x: 760, y: 182 }
		case 3:
			return { x: 980, y: 200 }
		default: {
			const relative = place - 4
			return { x: 300 + relative * 150, y: 280 }
		}
	}
}

export type NPC = {
	cellId: number
	imageUrl: string
	mirror?: boolean
}

export const NPCList: NPC[] = [
	{
		cellId: 97,
		imageUrl: `${CDN_URL_BASE}/map/snakes/black_mage.avif`
	},
	{
		cellId: 99,
		imageUrl: `${CDN_URL_BASE}/map/snakes/beer_golem.avif`,
		mirror: true
	},
	{
		cellId: 76,
		imageUrl: `${CDN_URL_BASE}/map/snakes/lizard.avif`
	},
	{
		cellId: 47,
		imageUrl: `${CDN_URL_BASE}/map/snakes/sans.avif`
	},
	{
		cellId: 54,
		imageUrl: `${CDN_URL_BASE}/map/snakes/ghost.avif`
	},
	{
		cellId: 66,
		imageUrl: `${CDN_URL_BASE}/map/snakes/zombie_prime.avif`
	},
	{
		cellId: 96,
		imageUrl: `${CDN_URL_BASE}/map/snakes/smork.avif`
	},
	{
		cellId: 43,
		imageUrl: `${CDN_URL_BASE}/map/snakes/vampress.avif`
	},
	{
		cellId: 21,
		imageUrl: `${CDN_URL_BASE}/map/snakes/papich.avif`
	},
	{
		cellId: 27,
		imageUrl: `${CDN_URL_BASE}/map/snakes/snake.avif`,
		mirror: true
	},
	{
		cellId: 89,
		imageUrl: `${CDN_URL_BASE}/map/snakes/mud_golem.avif`
	},
	{
		cellId: 94,
		imageUrl: `${CDN_URL_BASE}/map/snakes/cell99.avif`
	},

	// ladders
	{
		cellId: 1,
		imageUrl: `${CDN_URL_BASE}/map/ladders/jocker.avif`
	},
	{
		cellId: 4,
		imageUrl: `${CDN_URL_BASE}/map/ladders/tree.avif`,
		mirror: true
	},
	{
		cellId: 44,
		imageUrl: `${CDN_URL_BASE}/map/ladders/fae.avif`,
		mirror: true
	},
	{
		cellId: 17,
		imageUrl: `${CDN_URL_BASE}/map/ladders/gnome.avif`,
		mirror: true
	},
	{
		cellId: 33,
		imageUrl: `${CDN_URL_BASE}/map/ladders/bard.avif`
	},
	{
		cellId: 42,
		imageUrl: `${CDN_URL_BASE}/map/ladders/paladin.avif`
	},
	{
		cellId: 71,
		imageUrl: `${CDN_URL_BASE}/map/ladders/mage.avif`
	},
	{
		cellId: 50,
		imageUrl: `${CDN_URL_BASE}/map/ladders/alchemist.avif`
	},
	{
		cellId: 62,
		imageUrl: `${CDN_URL_BASE}/map/ladders/elf_girl.avif`
	},
	{
		cellId: 85,
		imageUrl: `${CDN_URL_BASE}/map/ladders/mage_portal.avif`
	},
	{
		cellId: 13,
		imageUrl: `${CDN_URL_BASE}/map/ladders/tree_ladder.avif`
	},
	{
		cellId: 74,
		imageUrl: `${CDN_URL_BASE}/map/ladders/smith.avif`
	}
	// sort by cellId descending,
	// to make chat messages from below not be covered by NPCs
].sort((a, b) => b.cellId - a.cellId)
