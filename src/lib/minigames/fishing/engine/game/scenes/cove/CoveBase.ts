import { Container } from 'pixi.js'
import type { AssetBag } from '../../../assets'
import type { AreaDef, SceneLayout } from '../../../areas'
import { VIEW } from '../../../config'
import { randRange } from '../../../utils'
import { PixelWater } from '../pixelWater'
import { WaterSurface } from '../water'
import { waterLookFor } from '../waterLook'
import { DOCK, MOORED_BOAT, SHORE_X, type Glint, type WaterMark, type Whirl } from './geometry'

export class CoveBase {
	readonly layout: SceneLayout
	protected readonly area: AreaDef
	protected readonly assets: AssetBag
	protected readonly waterMarks: WaterMark[] = []
	protected readonly whirls: Whirl[] = []
	protected readonly glints: Glint[] = []
	/** Boat hull, rocked around {@link MOORED_BOAT} every frame. */
	protected boat: Container | null = null
	/** Living surface: the bay has the most wind of the three waters. */
	protected readonly water: WaterSurface
	/** Baked caustics, glitter and foam: the surface texture under the crests. */
	protected readonly pixelWater: PixelWater

	constructor(assets: AssetBag, area: AreaDef) {
		this.assets = assets
		this.area = area
		this.layout = area.layout
		this.addWaterMarks()

		this.water = new WaterSurface({
			palette: this.palette,
			isWater: (x, y) => this.isWater(x, y),
			// Open water in a steady breeze: quick drift, short and tall crests.
			flow: 12,
			energy: 0.85,
			chops: 54,
			sheens: 6,
			pops: 5
		})

		// The open sea is where the swell breaks: the quickest nets and the widest
		// foam edge of the three waters.
		this.pixelWater = new PixelWater({
			look: waterLookFor(this.area.water, this.palette),
			isShore: (x, y) => this.isBank(x, y)
		})
	}

	protected get palette() {
		return this.area.palette
	}

	protected shoreEdgeAt(y: number): number {
		return SHORE_X + Math.sin(y * 0.065) * 3.2 + Math.sin(y * 0.17 + 1.7) * 1.6
	}

	/**
	 * Centre for a snowdrift that has to stay on the bank.
	 *
	 * A drift is drawn around its centre, so mounds planted under the shoreline
	 * trees hung their waterward half over the water and read as snow sliding
	 * off the bank. The drift is pulled back until its lip stops two pixels
	 * short of the bank edge for its row.
	 */
	protected driftX(x: number, y: number, scale: number): number {
		return Math.min(x, this.shoreEdgeAt(y) - 2 - 13 * scale)
	}

	protected addWaterMarks(): void {
		for (let i = 0; i < 22; i += 1) {
			this.waterMarks.push({
				x: randRange(SHORE_X + 24, VIEW.width - 26),
				y: randRange(30, VIEW.height - 14),
				radius: randRange(5, 13),
				phase: randRange(0, Math.PI * 2),
				speed: randRange(0.45, 1.15),
				alpha: randRange(0.05, 0.12)
			})
		}

		for (let i = 0; i < 2; i += 1) {
			this.whirls.push({
				x: randRange(SHORE_X + 36, VIEW.width - 40),
				y: randRange(60, 210),
				radius: randRange(8, 13),
				phase: randRange(0, Math.PI * 2),
				spin: randRange(0.16, 0.32),
				alpha: randRange(0.05, 0.085)
			})
		}

		// Twinkles on top of the static sparkles: the sea surface has to move
		// somewhere, now that the long ripple lines are only a background layer.
		for (let i = 0; i < 46; i += 1) {
			this.glints.push({
				x: randRange(SHORE_X + 18, VIEW.width - 10),
				y: randRange(12, VIEW.height - 8),
				phase: randRange(0, Math.PI * 2),
				speed: randRange(1.4, 3.6),
				size: Math.random() > 0.82 ? 2 : 1
			})
		}
	}
	attachWater(layer: Container): void {
		layer.addChild(this.pixelWater)
	}

	updateWater(time: number): void {
		this.pixelWater.update(time)
	}

	/**
	 * The snow bank left of the wavy waterline, and nothing else: the pier and the
	 * moored boat are dry too, but they are props standing in the water, not a
	 * shore for the foam to break against.
	 */
	protected isBank(x: number, y: number): boolean {
		return x <= this.shoreEdgeAt(y)
	}

	isWater(x: number, y: number): boolean {
		if (this.isBank(x, y)) return false
		// The deck plus its posts and snow caps: a ripple that clipped the pier's
		// top edge read as a wave running over the planks.
		if (
			x >= DOCK.x - 4 &&
			x <= DOCK.x + DOCK.width + 4 &&
			y >= DOCK.y - 6 &&
			y <= DOCK.bottom + 2
		) {
			return false
		}
		// The moored rowboat is solid too: waves and shoals have to go around it,
		// not over the hull.
		if (
			x >= MOORED_BOAT.x - 26 &&
			x <= MOORED_BOAT.x + 26 &&
			y >= MOORED_BOAT.y - 22 &&
			y <= MOORED_BOAT.y + 18
		) {
			return false
		}
		return true
	}
}
