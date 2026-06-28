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
		centerY: 195,
	},
	2: {
		centerX: 815,
		centerY: 205,
	},
	3: {
		centerX: 860,
		centerY: 500,
	},
	4: {
		centerX: 750,
		centerY: 640,
	},
	5: {
		centerX: 585,
		centerY: 630,
	},
	6: {
		centerX: 440,
		centerY: 600,
	},
	7: {
		centerX: 290,
		centerY: 610,
	},
	8: {
		centerX: 280,
		centerY: 750,
	},
	9: {
		centerX: 285,
		centerY: 895,
	},
	10: {
		centerX: 455,
		centerY: 950,
	},
	11: {
		centerX: 590,
		centerY: 950,
	},
	12: {
		centerX: 750,
		centerY: 960,
	},
	13: {
		centerX: 900,
		centerY: 950,
	},
	14: {
		centerX: 1070,
		centerY: 950,
	},
	15: {
		centerX: 1210,
		centerY: 930,
	},
	16: {
		centerX: 1210,
		centerY: 1070,
	},
	17: {
		centerX: 1210,
		centerY: 1200,
	},
	18: {
		centerX: 1200,
		centerY: 1330,
	},
	19: {
		centerX: 1030,
		centerY: 1330,
	},
	20: {
		centerX: 870,
		centerY: 1340,
	},
	21: {
		centerX: 710,
		centerY: 1340,
	},
	22: {
		centerX: 560,
		centerY: 1340,
	},
	23: {
		centerX: 400,
		centerY: 1340,
	},
	24: {
		centerX: 260,
		centerY: 1320,
	},
	25: {
		centerX: 130,
		centerY: 1355,
	},
	26: {
		centerX: 120,
		centerY: 1490,
	},
	27: {
		centerX: 135,
		centerY: 1635,
	},
	28: {
		centerX: 135,
		centerY: 1755,
	},
	29: {
		centerX: 145,
		centerY: 1885,
	},
	30: {
		centerX: 155,
		centerY: 2030,
	},
	31: {
		centerX: 290,
		centerY: 2025,
	},
	32: {
		centerX: 450,
		centerY: 2025,
	},
	33: {
		centerX: 615,
		centerY: 2035,
	},
	34: {
		centerX: 770,
		centerY: 2035,
	},
	35: {
		centerX: 940,
		centerY: 2025,
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
		centerX: 1375,
		centerY: 2030,
	},
	39: {
		centerX: 1520,
		centerY: 2015,
	},
	40: {
		centerX: 1520,
		centerY: 1850,
	},
	41: {
		centerX: 1520,
		centerY: 1675,
	},
	42: {
		centerX: 1510,
		centerY: 1520,
	},
	43: {
		centerX: 1500,
		centerY: 1370,
	},
	44: {
		centerX: 1500,
		centerY: 1230,
	},
	45: {
		centerX: 1500,
		centerY: 1080,
	},
	46: {
		centerX: 1500,
		centerY: 940
	},
	47: {
		centerX: 1500,
		centerY: 810,
	},
	48: {
		centerX: 1510,
		centerY: 680,
	},
	49: {
		centerX: 1640,
		centerY: 690,
	},
	50: {
		centerX: 1780,
		centerY: 690,
	},
	51: {
		centerX: 1930,
		centerY: 700,
	},
	52: {
		centerX: 2060,
		centerY: 690,
	},
	53: {
		centerX: 2200,
		centerY: 710,
	},
	54: {
		centerX: 2340,
		centerY: 700,
	},
	55: {
		centerX: 2360,
		centerY: 850,
	},
	56: {
		centerX: 2370,
		centerY: 980,
	},
	57: {
		centerX: 2365,
		centerY: 1110,
	},
	58: {
		centerX: 2210,
		centerY: 1110,
	},
	59: {
		centerX: 2030,
		centerY: 1100,
	},
	60: {
		centerX: 1850,
		centerY: 1110,
	},
	61: {
		centerX: 1825,
		centerY: 1260,
	},
	62: {
		centerX: 1825,
		centerY: 1400,
	},
	63: {
		centerX: 1825,
		centerY: 1550,
	},
	64: {
		centerX: 1815,
		centerY: 1710,
	},
	65: {
		centerX: 1830,
		centerY: 1885,
	},
	66: {
		centerX: 1980,
		centerY: 1920,
	},
	67: {
		centerX: 2110,
		centerY: 1925,
	},
	68: {
		centerX: 2265,
		centerY: 1925,
	},
	69: {
		centerX: 2405,
		centerY: 1920,
	},
	70: {
		centerX: 2570,
		centerY: 1910,
	},
	71: {
		centerX: 2730,
		centerY: 1905,
	},
	72: {
		centerX: 2900,
		centerY: 1910,
	},
	73: {
		centerX: 2930,
		centerY: 1760,
	},
	74: {
		centerX: 2940,
		centerY: 1590,
	},
	75: {
		centerX: 2930,
		centerY: 1430,
	},
	76: {
		centerX: 2930,
		centerY: 1300,
	},
	77: {
		centerX: 3060,
		centerY: 1310,
	},
	78: {
		centerX: 3200,
		centerY: 1310,
	},
	79: {
		centerX: 3340,
		centerY: 1310,
	},
	80: {
		centerX: 3490,
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
