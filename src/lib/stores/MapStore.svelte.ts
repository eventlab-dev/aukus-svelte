import { LastMapPosition } from '$lib/constants'
import type { CellPosition, CellPositionNew } from '$lib/mapUtils'

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

	cellPositions = CellPositions
	cellHeight = 50
	cellWidth = 50
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


const CellPositions: Record<number, CellPositionNew> = {
	0: {
		centerX: 30,
		centerY: 30,
	},
	1: {
		centerX: 90,
		centerY: 65,
	},
	2: {
		centerX: 140,
		centerY: 110,
	},
	3: {
		centerX: 140,
		centerY: 170,
	},
	4: {
		centerX: 110,
		centerY: 220,
	},
	5: {
		centerX: 80,
		centerY: 270,
	},
	6: {
		centerX: 50,
		centerY: 330,
	},
	7: {
		centerX: 40,
		centerY: 385,
	},
	8: {
		centerX: 40,
		centerY: 440,
	},
	9: {
		centerX: 55,
		centerY: 500,
	},
	10: {
		centerX: 100,
		centerY: 550,
	},
	11: {
		centerX: 160,
		centerY: 580,
	},
	12: {
		centerX: 260,
		centerY: 580,
	},
	13: {
		centerX: 330,
		centerY: 530,
	},
	14: {
		centerX: 360,
		centerY: 460,
	},
	15: {
		centerX: 360,
		centerY: 400,
	},
	16: {
		centerX: 340,
		centerY: 340,
	},
	17: {
		centerX: 290,
		centerY: 300,
	},
	18: {
		centerX: 230,
		centerY: 290,
	},
	19: {
		centerX: 160,
		centerY: 310,
	},
	20: {
		centerX: 130,
		centerY: 360,
	},
	21: {
		centerX: 120,
		centerY: 420,
	},
	22: {
		centerX: 135,
		centerY: 480,
	},
	23: {
		centerX: 170,
		centerY: 530,
	},
	24: {
		centerX: 380,
		centerY: 570,
	},
	25: {
		centerX: 440,
		centerY: 520,
	},
	26: {
		centerX: 470,
		centerY: 460,
	},
	27: {
		centerX: 470,
		centerY: 400,
	},
	28: {
		centerX: 460,
		centerY: 345,
	},
	29: {
		centerX: 430,
		centerY: 290,
	},
	30: {
		centerX: 380,
		centerY: 250,
	},
	31: {
		centerX: 0,
		centerY: 0,
	},
	32: {
		centerX: 0,
		centerY: 0,
	},
	33: {
		centerX: 0,
		centerY: 0,
	},
	34: {
		centerX: 0,
		centerY: 0,
	},
	35: {
		centerX: 0,
		centerY: 0,
	},
	36: {
		centerX: 0,
		centerY: 0,
	},
	37: {
		centerX: 0,
		centerY: 0,
	},
	38: {
		centerX: 0,
		centerY: 0,
	},
	39: {
		centerX: 0,
		centerY: 0,
	},
	40: {
		centerX: 0,
		centerY: 0,
	},
	41: {
		centerX: 0,
		centerY: 0,
	},
	42: {
		centerX: 0,
		centerY: 0,
	},
	43: {
		centerX: 0,
		centerY: 0,
	},
	44: {
		centerX: 0,
		centerY: 0,
	},
	45: {
		centerX: 0,
		centerY: 0,
	},
	46: {
		centerX: 0,
		centerY: 0,
	},
	47: {
		centerX: 0,
		centerY: 0,
	},
	48: {
		centerX: 0,
		centerY: 0,
	},
	49: {
		centerX: 0,
		centerY: 0,
	},
	50: {
		centerX: 0,
		centerY: 0,
	},
	51: {
		centerX: 0,
		centerY: 0,
	},
	52: {
		centerX: 0,
		centerY: 0,
	},
	53: {
		centerX: 0,
		centerY: 0,
	},
	54: {
		centerX: 0,
		centerY: 0,
	},
	55: {
		centerX: 0,
		centerY: 0,
	},
	56: {
		centerX: 0,
		centerY: 0,
	},
	57: {
		centerX: 0,
		centerY: 0,
	},
	58: {
		centerX: 0,
		centerY: 0,
	},
	59: {
		centerX: 0,
		centerY: 0,
	},
	60: {
		centerX: 0,
		centerY: 0,
	},
	61: {
		centerX: 0,
		centerY: 0,
	},
	62: {
		centerX: 0,
		centerY: 0,
	},
	63: {
		centerX: 0,
		centerY: 0,
	},
	64: {
		centerX: 0,
		centerY: 0,
	},
	65: {
		centerX: 0,
		centerY: 0,
	},
	66: {
		centerX: 0,
		centerY: 0,
	},
	67: {
		centerX: 0,
		centerY: 0,
	},
	68: {
		centerX: 0,
		centerY: 0,
	},
	69: {
		centerX: 0,
		centerY: 0,
	},
	70: {
		centerX: 0,
		centerY: 0,
	},
	71: {
		centerX: 0,
		centerY: 0,
	},
	72: {
		centerX: 0,
		centerY: 0,
	},
	73: {
		centerX: 0,
		centerY: 0,
	},
	74: {
		centerX: 0,
		centerY: 0,
	},
	75: {
		centerX: 0,
		centerY: 0,
	},
	76: {
		centerX: 0,
		centerY: 0,
	},
	77: {
		centerX: 0,
		centerY: 0,
	},
	78: {
		centerX: 0,
		centerY: 0,
	},
	79: {
		centerX: 0,
		centerY: 0,
	},
	80: {
		centerX: 0,
		centerY: 0,
	},
	81: {
		centerX: 0,
		centerY: 0,
	},
	82: {
		centerX: 0,
		centerY: 0,
	},
	83: {
		centerX: 0,
		centerY: 0,
	},
	84: {
		centerX: 0,
		centerY: 0,
	},
	85: {
		centerX: 0,
		centerY: 0,
	},
	86: {
		centerX: 0,
		centerY: 0,
	},
	87: {
		centerX: 0,
		centerY: 0,
	},
	88: {
		centerX: 0,
		centerY: 0,
	},
	89: {
		centerX: 0,
		centerY: 0,
	},
	90: {
		centerX: 0,
		centerY: 0,
	},
	91: {
		centerX: 0,
		centerY: 0,
	},
	92: {
		centerX: 0,
		centerY: 0,
	},
	93: {
		centerX: 0,
		centerY: 0,
	},
	94: {
		centerX: 0,
		centerY: 0,
	},
	95: {
		centerX: 0,
		centerY: 0,
	},
	96: {
		centerX: 0,
		centerY: 0,
	},
	97: {
		centerX: 0,
		centerY: 0,
	},
	98: {
		centerX: 0,
		centerY: 0,
	},
	99: {
		centerX: 0,
		centerY: 0,
	},
	100: {
		centerX: 0,
		centerY: 0,
	},
	101: {
		centerX: 0,
		centerY: 0,
	},
}
