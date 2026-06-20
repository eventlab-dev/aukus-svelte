import type { CellPositionNew } from '$lib/mapUtils'

const BaseCellSize = 121
const BaseCell100X = 244
const BaseCell100Y = 513

export class MapStore {
	scale = $state(1)

	// baseCellHeight = 50
	// baseCellWidth = 50

	// cellHeight = $derived(this.baseCellHeight * this.scale)
	// cellWidth = $derived(this.baseCellWidth * this.scale)

	cellSize = $derived(BaseCellSize * this.scale)
	cell100X = $derived(BaseCell100X * this.scale)
	cell100Y = $derived(BaseCell100Y * this.scale)

	cell100Position = $derived({
		x: this.cell100X,
		y: this.cell100Y,
		x1: this.cell100X + this.cellSize,
		y1: this.cell100Y + this.cellSize
	})

	cellPositionById = CellPositions

	// 102: {
	// 	centerX: 880,
	// 	centerY: 230,
	// }

	winnerPositions: Record<number, CellPositionNew> = {
		1: { centerX: 635, centerY: 90 },
		2: { centerX: 755, centerY: 105 },
		3: { centerX: 515, centerY: 115 }
	}
}


const CellPositions: Record<number, CellPositionNew> = {
	0: {
		centerX: 90,
		centerY: 210,
	},
	1: {
		centerX: 620,
		centerY: 210,
	},
	2: {
		centerX: 820,
		centerY: 210,
	},
	3: {
		centerX: 860,
		centerY: 430,
	},
	4: {
		centerX: 760,
		centerY: 610,
	},
	5: {
		centerX: 600,
		centerY: 610,
	},
	6: {
		centerX: 440,
		centerY: 610,
	},
	7: {
		centerX: 300,
		centerY: 610,
	},
	8: {
		centerX: 300,
		centerY: 750,
	},
	9: {
		centerX: 300,
		centerY: 920,
	},
	10: {
		centerX: 450,
		centerY: 920,
	},
	11: {
		centerX: 590,
		centerY: 920,
	},
	12: {
		centerX: 750,
		centerY: 920,
	},
	13: {
		centerX: 890,
		centerY: 920,
	},
	14: {
		centerX: 1050,
		centerY: 920,
	},
	15: {
		centerX: 1210,
		centerY: 920,
	},
	16: {
		centerX: 1210,
		centerY: 1040,
	},
	17: {
		centerX: 1210,
		centerY: 1165,
	},
	18: {
		centerX: 1210,
		centerY: 1290,
	},
	19: {
		centerX: 1050,
		centerY: 1290,
	},
	20: {
		centerX: 880,
		centerY: 1290,
	},
	21: {
		centerX: 720,
		centerY: 1290,
	},
	22: {
		centerX: 570,
		centerY: 1290,
	},
	23: {
		centerX: 400,
		centerY: 1290,
	},
	24: {
		centerX: 260,
		centerY: 1290,
	},
	25: {
		centerX: 150,
		centerY: 1290,
	},
	26: {
		centerX: 150,
		centerY: 1410,
	},
	27: {
		centerX: 150,
		centerY: 1535,
	},
	28: {
		centerX: 150,
		centerY: 1665,
	},
	29: {
		centerX: 150,
		centerY: 1790,
	},
	30: {
		centerX: 150,
		centerY: 2010,
	},
	31: {
		centerX: 300,
		centerY: 2010,
	},
	32: {
		centerX: 460,
		centerY: 2010,
	},
	33: {
		centerX: 615,
		centerY: 2010,
	},
	34: {
		centerX: 780,
		centerY: 2010,
	},
	35: {
		centerX: 930,
		centerY: 2010,
	},
	36: {
		centerX: 1090,
		centerY: 2010,
	},
	37: {
		centerX: 1220,
		centerY: 2010,
	},
	38: {
		centerX: 1370,
		centerY: 2010,
	},
	39: {
		centerX: 1510,
		centerY: 2010,
	},
	40: {
		centerX: 1510,
		centerY: 1820,
	},
	41: {
		centerX: 1510,
		centerY: 1660,
	},
	42: {
		centerX: 1510,
		centerY: 1520,
	},
	43: {
		centerX: 1510,
		centerY: 1370,
	},
	44: {
		centerX: 1510,
		centerY: 1240,
	},
	45: {
		centerX: 1510,
		centerY: 1120,
	},
	46: {
		centerX: 1510,
		centerY: 990
	},
	47: {
		centerX: 1510,
		centerY: 850,
	},
	48: {
		centerX: 1510,
		centerY: 710,
	},
	49: {
		centerX: 1650,
		centerY: 710,
	},
	50: {
		centerX: 1790,
		centerY: 710,
	},
	51: {
		centerX: 1930,
		centerY: 710,
	},
	52: {
		centerX: 2070,
		centerY: 710,
	},
	53: {
		centerX: 2200,
		centerY: 710,
	},
	54: {
		centerX: 2340,
		centerY: 710,
	},
	55: {
		centerX: 2340,
		centerY: 830,
	},
	56: {
		centerX: 2340,
		centerY: 950,
	},
	57: {
		centerX: 2340,
		centerY: 1080,
	},
	58: {
		centerX: 2150,
		centerY: 1080,
	},
	59: {
		centerX: 1970,
		centerY: 1080,
	},
	60: {
		centerX: 1830,
		centerY: 1080,
	},
	61: {
		centerX: 1830,
		centerY: 1220,
	},
	62: {
		centerX: 1830,
		centerY: 1350,
	},
	63: {
		centerX: 1830,
		centerY: 1490,
	},
	64: {
		centerX: 1830,
		centerY: 1620,
	},
	65: {
		centerX: 1830,
		centerY: 1740,
	},
	66: {
		centerX: 1830,
		centerY: 1885,
	},
	67: {
		centerX: 1970,
		centerY: 1885,
	},
	68: {
		centerX: 2120,
		centerY: 1885,
	},
	69: {
		centerX: 2260,
		centerY: 1885,
	},
	70: {
		centerX: 2410,
		centerY: 1885,
	},
	71: {
		centerX: 2560,
		centerY: 1885,
	},
	72: {
		centerX: 2760,
		centerY: 1885,
	},
	73: {
		centerX: 2930,
		centerY: 1885,
	},
	74: {
		centerX: 2930,
		centerY: 1735,
	},
	75: {
		centerX: 2930,
		centerY: 1590,
	},
	76: {
		centerX: 2930,
		centerY: 1440,
	},
	77: {
		centerX: 2930,
		centerY: 1310,
	},
	78: {
		centerX: 3130,
		centerY: 1310,
	},
	79: {
		centerX: 3270,
		centerY: 1310,
	},
	80: {
		centerX: 3470,
		centerY: 1310,
	},
	81: {
		centerX: 3670,
		centerY: 1225,
	},
	82: {
		centerX: 3670,
		centerY: 1030,
	},
	83: {
		centerX: 3670,
		centerY: 860,
	},
	84: {
		centerX: 3670,
		centerY: 715,
	},
	85: {
		centerX: 3670,
		centerY: 560,
	},
	86: {
		centerX: 3670,
		centerY: 350,
	},
	87: {
		centerX: 3670,
		centerY: 155,
	},
	88: {
		centerX: 3530,
		centerY: 155,
	},
	89: {
		centerX: 3335,
		centerY: 155,
	},
	90: {
		centerX: 3130,
		centerY: 155,
	},
	91: {
		centerX: 2960,
		centerY: 155,
	},
	92: {
		centerX: 2960,
		centerY: 300,
	},
	93: {
		centerX: 2960,
		centerY: 450,
	},
	94: {
		centerX: 2960,
		centerY: 590,
	},
	95: {
		centerX: 2960,
		centerY: 740,
	},
	96: {
		centerX: 2960,
		centerY: 870,
	},
	97: {
		centerX: 2960,
		centerY: 995,
	},
	98: {
		centerX: 2815,
		centerY: 995,
	},
	99: {
		centerX: 2640,
		centerY: 995,
	},
	100: {
		centerX: 2640,
		centerY: 845,
	},
	101: {
		centerX: 2645,
		centerY: 666,
	},
}
