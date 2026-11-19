import { Container } from 'pixi.js'
import type { AssetBag } from '../../../assets'
import type { AreaDef, SceneLayout } from '../../../areas'
import { lerp, randRange } from '../../../utils'
import { mixColor } from '../../../world'
import { ditherNoise } from '../dither'
import { PixelWater } from '../pixelWater'
import { WaterSurface } from '../water'
import { waterLookFor } from '../waterLook'
import type { LogShape } from '../logs'
import {
	CENTER,
	DEEP,
	DEEP_RADIUS,
	DEPTH_LAYERS,
	RADIUS,
	SHORE_POINTS,
	type Bubble,
	type IceDisc,
	type Wisp
} from './geometry'

export class PoolBase {
	readonly layout: SceneLayout
	protected readonly area: AreaDef
	protected readonly assets: AssetBag
	protected readonly discs: IceDisc[] = []
	protected readonly logs: LogShape[] = []
	/** Trunks in the water and the motion each one rides. */
	protected readonly trunks: Array<{
		node: Container
		baseX: number
		baseY: number
		phase: number
		speed: number
		roll: number
	}> = []
	protected readonly wisps: Wisp[] = []
	protected readonly bubbles: Bubble[] = []
	/** Living surface: the lake is calm, so it breathes rather than rolls. */
	protected readonly water: WaterSurface
	/** Baked caustics, glitter and foam: the surface texture under the crests. */
	protected readonly pixelWater: PixelWater

	constructor(assets: AssetBag, area: AreaDef) {
		this.assets = assets
		this.area = area
		this.layout = area.layout

		this.water = new WaterSurface({
			palette: this.palette,
			isWater: (x, y) => this.isWater(x, y),
			// A forest lake is nearly still: a slow drift and long, low crests.
			flow: 6,
			energy: 0.3,
			chops: 32,
			sheens: 6,
			pops: 7
		})

		// The lake breathes: broad nets at half the sea's pace, and the least foam
		// of the three, because nothing here is breaking.
		this.pixelWater = new PixelWater({
			look: waterLookFor(this.area.water, this.palette),
			isShore: (x, y) => this.isBank(x, y)
		})

		for (let i = 0; i < 9; i += 1) {
			// Ice floats. A disc whose rim crossed the ragged shoreline sat on the
			// bank as a flat pale oval — the puddle the snow should never show — so
			// every disc, rim included, has to land in open water.
			for (let tries = 0; tries < 40; tries += 1) {
				const angle = randRange(0, Math.PI * 2)
				const r = randRange(0.25, 0.9)
				const x = CENTER.x + Math.cos(angle) * RADIUS.x * r
				const y = CENTER.y + Math.sin(angle) * RADIUS.y * r
				const rx = randRange(4, 12)
				const ry = randRange(1.5, 4)
				const dry =
					!this.isWater(x - rx, y) ||
					!this.isWater(x + rx, y) ||
					!this.isWater(x, y - ry) ||
					!this.isWater(x, y + ry)
				if (dry) continue
				this.discs.push({ x, y, rx, ry, alpha: randRange(0.18, 0.4) })
				break
			}
		}

		// Three drifting trunks, all lying within fifteen degrees of flat: that is
		// the angle a log actually floats at, and anything steeper reads as a pole
		// leaning into the lake. They sit in open water clear of the bank trees,
		// where the canopies would otherwise bury them.
		const water = mixColor(this.palette.waterStops[1].color, this.palette.waterStops[2].color, 0.45)
		this.logs.push(
			{
				x: 148,
				y: 92,
				angle: -0.1,
				length: 46,
				rootRadius: 5,
				tipRadius: 4,
				snow: 0.85,
				seed: 3,
				water
			},
			{
				x: 338,
				y: 158,
				angle: 0.14,
				length: 40,
				rootRadius: 4.6,
				tipRadius: 3.7,
				snow: 0.5,
				seed: 11,
				water
			},
			{
				x: 224,
				y: 62,
				angle: -0.04,
				length: 36,
				rootRadius: 4.3,
				tipRadius: 3.4,
				snow: 0.95,
				seed: 23,
				water
			}
		)

		for (let i = 0; i < 5; i += 1) {
			const angle = (i / 5) * Math.PI * 2 + 0.5
			this.wisps.push({
				x: CENTER.x + Math.cos(angle) * (RADIUS.x - 22),
				y: CENTER.y + Math.sin(angle) * (RADIUS.y - 18),
				phase: randRange(0, Math.PI * 2),
				speed: randRange(0.8, 1.6),
				radius: randRange(1.4, 2.6)
			})
		}

		for (let i = 0; i < 14; i += 1) {
			this.bubbles.push({
				x: randRange(CENTER.x - RADIUS.x + 30, CENTER.x + RADIUS.x - 30),
				y: randRange(CENTER.y - RADIUS.y + 30, CENTER.y + RADIUS.y - 30),
				speed: randRange(1.5, 4),
				phase: randRange(0, Math.PI * 2)
			})
		}
	}

	protected get palette() {
		return this.area.palette
	}

	protected shoreScale(angle: number): number {
		return (
			1 +
			0.07 * Math.sin(angle * 3 + 0.7) +
			0.045 * Math.sin(angle * 7 + 2.4) +
			0.03 * Math.sin(angle * 11 + 5.1) +
			0.02 * Math.sin(angle * 19 + 1.9) +
			0.015 * Math.sin(angle * 29 + 0.3)
		)
	}

	protected shorePolygon(scaleDelta: number, shrink = 1): number[] {
		const points: number[] = []
		for (let i = 0; i < SHORE_POINTS; i += 1) {
			const angle = (i / SHORE_POINTS) * Math.PI * 2
			const scale = (this.shoreScale(angle) + scaleDelta) * shrink
			points.push(
				CENTER.x + Math.cos(angle) * RADIUS.x * scale,
				CENTER.y + Math.sin(angle) * RADIUS.y * scale
			)
		}
		return points
	}

	/** Raggedness of the deep basin: much coarser than the shoreline. */
	protected deepScale(angle: number): number {
		return (
			1 +
			0.38 * Math.sin(angle * 2 + 1.1) +
			0.22 * Math.sin(angle * 3 - 0.6) +
			0.14 * Math.sin(angle * 5 + 2.2) +
			0.08 * Math.sin(angle * 7 + 4.4)
		)
	}

	/**
	 * One depth contour: `t` = 0 is the shoreline, 1 the bottom of the basin.
	 * Every contour blends the shore outline with the off-centre basin, so the
	 * dark water drifts to one side and the shelves are wider on the other.
	 *
	 * Each contour is also dithered by up to a couple of pixels. Without that the
	 * contours stay parallel and the one-unit colour step between neighbours
	 * reads as a long staircase; with it the step scatters into water grain.
	 */
	protected depthPolygon(t: number): number[] {
		const points: number[] = []
		const layer = Math.round(t * DEPTH_LAYERS)
		// The dither has to vanish at the shoreline, where the ice rim is drawn.
		const amp = Math.min(1, t * 6) * 2.1
		for (let i = 0; i < SHORE_POINTS; i += 1) {
			const angle = (i / SHORE_POINTS) * Math.PI * 2
			const scale = this.shoreScale(angle)
			const shoreX = CENTER.x + Math.cos(angle) * RADIUS.x * scale
			const shoreY = CENTER.y + Math.sin(angle) * RADIUS.y * scale
			const deep = this.deepScale(angle)
			const basinX = DEEP.x + Math.cos(angle) * DEEP_RADIUS.x * deep
			const basinY = DEEP.y + Math.sin(angle) * DEEP_RADIUS.y * deep
			points.push(
				lerp(shoreX, basinX, t) + ditherNoise(i, layer) * amp,
				lerp(shoreY, basinY, t) + ditherNoise(i + 977, layer) * amp
			)
		}
		return points
	}

	// ---------------------------------------------------------------- scenery
	attachWater(layer: Container): void {
		layer.addChild(this.pixelWater)
	}

	updateWater(time: number): void {
		this.pixelWater.update(time)
	}

	/**
	 * The snowfield around the hole, outside the ragged shoreline. The skiff the
	 * angler fishes from is dry as well, but it is a prop afloat, not a shore.
	 */
	protected isBank(x: number, y: number): boolean {
		const nx = (x - CENTER.x) / RADIUS.x
		const ny = (y - CENTER.y) / RADIUS.y
		const radius = Math.hypot(nx, ny)
		return radius > this.shoreScale(Math.atan2(ny, nx))
	}

	isWater(x: number, y: number): boolean {
		if (this.isBank(x, y)) return false
		// The angler and the whole skiff are dry: the hull is wider and longer than
		// the old box around the angler, so ripples used to lap over the bow and
		// stern. The box now covers the hull with a little air around it.
		const { x: ax, y: ay } = this.layout.angler
		if (x >= ax - 26 && x <= ax + 26 && y >= ay - 24 && y <= ay + 16) {
			return false
		}
		return true
	}
}
