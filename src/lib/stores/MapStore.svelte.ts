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
		return Object.fromEntries(
			Object.entries(this.cellPositions).map(([key, pos]) => [
				Number(key),
				{
					x: pos.centerX - this.cellWidth / 2,
					y: pos.centerY - this.cellHeight / 2,
					x1: pos.centerX + this.cellWidth / 2,
					y1: pos.centerY + this.cellHeight / 2
				}
			])
		)
		// const positions: Record<number, CellPosition> = {}
		// // Loop up to LastMapPosition + 1 (102) to include the special completed/winner cell position
		// for (let i = 0; i <= LastMapPosition + 1; i++) {
		// 	positions[i] = calculateCellPosition({
		// 		cellId: i,
		// 		cellSize: this.cellSize,
		// 		cell100Pos: this.cell100Position
		// 	})
		// }
		// return positions
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
		centerX: 80,
		centerY: 70,
	},
	1: {
		centerX: 200,
		centerY: 70,
	},
	2: {
		centerX: 270,
		centerY: 70,
	},
	3: {
		centerX: 280,
		centerY: 140,
	},
	4: {
		centerX: 280,
		centerY: 200,
	},
	5: {
		centerX: 200,
		centerY: 200,
	},
	6: {
		centerX: 150,
		centerY: 200,
	},
	7: {
		centerX: 100,
		centerY: 200,
	},
	8: {
		centerX: 100,
		centerY: 250,
	},
	9: {
		centerX: 100,
		centerY: 310,
	},
	10: {
		centerX: 150,
		centerY: 310,
	},
	11: {
		centerX: 200,
		centerY: 310,
	},
	12: {
		centerX: 250,
		centerY: 310,
	},
	13: {
		centerX: 300,
		centerY: 310,
	},
	14: {
		centerX: 350,
		centerY: 310,
	},
	15: {
		centerX: 400,
		centerY: 310,
	},
	16: {
		centerX: 400,
		centerY: 360,
	},
	17: {
		centerX: 400,
		centerY: 410,
	},
	18: {
		centerX: 400,
		centerY: 460,
	},
	19: {
		centerX: 350,
		centerY: 430,
	},
	20: {
		centerX: 290,
		centerY: 430,
	},
	21: {
		centerX: 240,
		centerY: 430,
	},
	22: {
		centerX: 190,
		centerY: 430,
	},
	23: {
		centerX: 140,
		centerY: 430,
	},
	24: {
		centerX: 90,
		centerY: 430,
	},
	25: {
		centerX: 40,
		centerY: 430,
	},
	26: {
		centerX: 40,
		centerY: 480,
	},
	27: {
		centerX: 40,
		centerY: 530,
	},
	28: {
		centerX: 40,
		centerY: 580,
	},
	29: {
		centerX: 40,
		centerY: 630,
	},
	30: {
		centerX: 40,
		centerY: 680,
	},
	31: {
		centerX: 95,
		centerY: 665,
	},
	32: {
		centerX: 150,
		centerY: 665,
	},
	33: {
		centerX: 205,
		centerY: 665,
	},
	34: {
		centerX: 255,
		centerY: 665,
	},
	35: {
		centerX: 310,
		centerY: 665,
	},
	36: {
		centerX: 360,
		centerY: 665,
	},
	37: {
		centerX: 410,
		centerY: 665,
	},
	38: {
		centerX: 460,
		centerY: 665,
	},
	39: {
		centerX: 510,
		centerY: 665,
	},
	40: {
		centerX: 510,
		centerY: 610,
	},
	41: {
		centerX: 510,
		centerY: 560,
	},
	42: {
		centerX: 510,
		centerY: 510,
	},
	43: {
		centerX: 510,
		centerY: 460,
	},
	44: {
		centerX: 510,
		centerY: 410,
	},
	45: {
		centerX: 510,
		centerY: 360,
	},
	46: {
		centerX: 510,
		centerY: 310,
	},
	47: {
		centerX: 510,
		centerY: 260,
	},
	48: {
		centerX: 510,
		centerY: 210,
	},
	49: {
		centerX: 550,
		centerY: 240,
	},
	50: {
		centerX: 600,
		centerY: 240,
	},
	51: {
		centerX: 650,
		centerY: 240,
	},
	52: {
		centerX: 700,
		centerY: 240,
	},
	53: {
		centerX: 750,
		centerY: 240,
	},
	54: {
		centerX: 800,
		centerY: 240,
	},
	55: {
		centerX: 770,
		centerY: 290,
	},
	56: {
		centerX: 770,
		centerY: 340,
	},
	57: {
		centerX: 770,
		centerY: 390,
	},
	58: {
		centerX: 720,
		centerY: 370,
	},
	59: {
		centerX: 660,
		centerY: 370,
	},
	60: {
		centerX: 610,
		centerY: 370,
	},
	61: {
		centerX: 610,
		centerY: 420,
	},
	62: {
		centerX: 610,
		centerY: 470,
	},
	63: {
		centerX: 610,
		centerY: 520,
	},
	64: {
		centerX: 610,
		centerY: 570,
	},
	65: {
		centerX: 610,
		centerY: 620,
	},
	66: {
		centerX: 610,
		centerY: 670,
	},
	67: {
		centerX: 660,
		centerY: 620,
	},
	68: {
		centerX: 710,
		centerY: 620,
	},
	69: {
		centerX: 760,
		centerY: 620,
	},
	70: {
		centerX: 810,
		centerY: 620,
	},
	71: {
		centerX: 860,
		centerY: 620,
	},
	72: {
		centerX: 920,
		centerY: 620,
	},
	73: {
		centerX: 980,
		centerY: 620,
	},
	74: {
		centerX: 980,
		centerY: 570,
	},
	75: {
		centerX: 980,
		centerY: 520,
	},
	76: {
		centerX: 980,
		centerY: 470,
	},
	77: {
		centerX: 980,
		centerY: 420,
	},
	78: {
		centerX: 1040,
		centerY: 440,
	},
	79: {
		centerX: 1090,
		centerY: 440,
	},
	80: {
		centerX: 1140,
		centerY: 440,
	},
	81: {
		centerX: 1190,
		centerY: 440,
	},
	82: {
		centerX: 1240,
		centerY: 440,
	},
	83: {
		centerX: 1230,
		centerY: 390,
	},
	84: {
		centerX: 1230,
		centerY: 340,
	},
	85: {
		centerX: 1230,
		centerY: 290,
	},
	86: {
		centerX: 1230,
		centerY: 240,
	},
	87: {
		centerX: 1230,
		centerY: 190,
	},
	88: {
		centerX: 1230,
		centerY: 140,
	},
	89: {
		centerX: 1230,
		centerY: 90,
	},
	90: {
		centerX: 1180,
		centerY: 60,
	},
	91: {
		centerX: 1120,
		centerY: 60,
	},
	92: {
		centerX: 1050,
		centerY: 60,
	},
	93: {
		centerX: 980,
		centerY: 60,
	},
	94: {
		centerX: 980,
		centerY: 110,
	},
	95: {
		centerX: 980,
		centerY: 160,
	},
	96: {
		centerX: 980,
		centerY: 210,
	},
	97: {
		centerX: 980,
		centerY: 260,
	},
	98: {
		centerX: 980,
		centerY: 310,
	},
	99: {
		centerX: 930,
		centerY: 330,
	},
	100: {
		centerX: 880,
		centerY: 330,
	},
	101: {
		centerX: 880,
		centerY: 280,
	},
	102: {
		centerX: 880,
		centerY: 230,
	}
}
