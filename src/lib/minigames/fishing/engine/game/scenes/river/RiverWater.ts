import { Container, Graphics } from 'pixi.js'
import { clamp } from '../../../utils'
import { winterWaterAt } from '../../../world'
import { drawDepthRamp } from '../dither'
import { drawFloatingLog } from '../logs'
import { RiverBase } from './RiverBase'
import { BOULDERS, STONE, WATER_BOTTOM, WATER_TOP } from './geometry'

export class RiverWater extends RiverBase {
	protected drawWater(g: Graphics): void {
		// The far bank is the dark end of the ramp, the near bank the light one.
		drawDepthRamp(g, {
			axis: 'y',
			from: WATER_TOP,
			to: WATER_BOTTOM + 2,
			reverse: true,
			stops: this.palette.waterStops
		})
	}

	protected drawWaterDetails(g: Graphics): void {
		// The reach is drawn by the shared surface now: the depth ramp carries the
		// near-to-far colour, and the living current — caustics, glitter and foam —
		// is drawn by `pixelWater` above this layer. What used to live here was a
		// stand-in for moving water: a scatter of sky-sheen dashes down the channel,
		// sleeping ripples, a line of current crests and a trailing ripple that
		// pointed downstream. All of them were painted once, so on a river that now
		// runs they read as engraving on the surface, and they are gone.

		// Contact shade and a bright rim along both banks: the depth gradient
		// alone gives no sense of an embankment.
		this.traceEdge(g, (x) => this.farLine[x] + 1)
		g.stroke({ width: 3, color: this.palette.waterFar, alpha: 0.34 })
		this.traceEdge(g, (x) => this.farLine[x] + 13)
		g.stroke({ width: 10, color: this.palette.treeDark, alpha: 0.14 })
		this.traceEdge(g, (x) => this.farLine[x] + 4)
		g.stroke({ width: 2, color: this.palette.ice, alpha: 0.1 })

		this.traceEdge(g, (x) => this.nearLine[x] - 1)
		g.stroke({ width: 4, color: 0x08222f, alpha: 0.3 })
		this.traceEdge(g, (x) => this.nearLine[x] - 5)
		g.stroke({ width: 3, color: this.palette.ice, alpha: 0.1 })

		// A broken reflection of the fir line in the far water.
		for (const pine of this.bankTrees) {
			if (!pine.reflect) continue
			if (pine.x % 34 > 16) continue
			this.rect(
				g,
				pine.x - 1,
				this.farAt(pine.x) + 2,
				2,
				8 + (Math.round(pine.height) % 12),
				this.palette.treeDark,
				0.13
			)
		}

		// Cold mist over the upstream water: the reach leaves the frame in haze
		// instead of ending in a flat dark corner.
		for (const [x, y, rx, alpha] of [
			[64, 34, 96, 0.05],
			[150, 48, 74, 0.04],
			[26, 68, 62, 0.035]
		] as const) {
			g.ellipse(x, y, rx, rx * 0.15).fill({ color: 0xdff2f6, alpha })
		}

		// Sleeping ripples that belong to the water, not to the frame.
		// Current crests: short, brighter wavelets that show which way the river
		// runs even while the frame is still.
		// A ripple line that trails the current flowing in from upstream.
		//
		// All three are gone: they were static strokes standing in for a current
		// that the surface now actually runs.

		// The trunk is not painted here: it gets its own layer between the water
		// and the surface motion (see `drawFloating`), because the current rolls it
		// and a painted log would be frozen into the river bed.
		for (const rock of BOULDERS) {
			this.drawBoulder(g, rock.x, rock.y, rock.size)
		}
	}

	/**
   * The half-drowned trunk, in a container the current can rock.
   *
   * It sits in the open reach downstream of the cast, clear of the boulders and
   * of the bobber band, so it never reads as an obstacle the player should aim
   * around. Most of its body is above the waterline and a little snow lies on
   * it: at 58 it was a thin dark stick half a frame away, drowned deep enough
   * that only the bark ridge showed — driftwood the eye could not identify.

  */
	drawFloating(layer: Container): void {
		const length = 46
		const x = 352
		const y = (this.farAt(x) + this.nearAt(x)) / 2
		// Along the current: the trunk lies the way the river carries it.
		const angle = Math.atan2(this.nearAt(x + length / 2) - this.nearAt(x - length / 2), length)
		// Water colour at the trunk's own depth, so the submerged wash matches the
		// ramp painted underneath it instead of sitting on it as a grey film.
		const depth = clamp((y - WATER_TOP) / (WATER_BOTTOM + 2 - WATER_TOP))

		const node = new Container()
		node.position.set(x, y)
		const g = new Graphics()
		drawFloatingLog(
			g,
			{
				x: 0,
				y: 0,
				length,
				angle,
				rootRadius: 3.7,
				tipRadius: 2.8,
				submerged: 0.42,
				water: winterWaterAt(1 - depth, this.palette.waterStops),
				snow: 0.35,
				seed: 5
			},
			this.palette
		)
		node.addChild(g)
		layer.addChild(node)

		this.trunk = node
		this.trunkBaseX = x
		this.trunkBaseY = y
	}

	/**
	 * A boulder standing in the current.
	 *
	 * The old version was three stacked ellipses in a warm grey, which read as a
	 * floating mushroom rather than as stone. This one is built the way the rest
	 * of the scene is lit: an irregular faceted outline with a lit top face, a
	 * shaded side, a snow ridge along the cap, a dark waterline where the river
	 * cuts across it and a wake trailing downstream.
	 */
	protected drawBoulder(g: Graphics, x: number, y: number, size: number): void {
		const w = size * 1.45
		const h = size * 1.15
		const water = y + h * 0.34

		// Shadow on the bed and the slush collar the current pushes around it.
		g.ellipse(x + w * 0.12, water + h * 0.34, w * 1.24, h * 0.3).fill({
			color: this.palette.waterFar,
			alpha: 0.42
		})
		g.ellipse(x, water + h * 0.04, w * 1.12, h * 0.18).fill({
			color: this.palette.ice,
			alpha: 0.38
		})

		// Irregular stone outline: the apex sits left of centre and the shoulders
		// sit at different heights, so it never reads as a symmetric tent.
		const outline = [
			x - w * 0.34,
			y - h,
			x + w * 0.16,
			y - h * 0.9,
			x + w * 0.74,
			y - h * 0.42,
			x + w * 0.98,
			y + h * 0.02,
			x + w * 0.52,
			water + h * 0.16,
			x - w * 0.68,
			water + h * 0.2,
			x - w * 0.96,
			y + h * 0.06,
			x - w * 0.7,
			y - h * 0.44
		]
		g.poly(outline).fill(STONE.mid)
		g.poly(outline).stroke({ width: 1, color: STONE.dark, alpha: 0.5 })

		// Lit top face, tilted away from the light on the upper left. It uses the
		// brightest tone of the ramp, otherwise the cap and the body merge.
		g.poly([
			x - w * 0.34,
			y - h,
			x + w * 0.16,
			y - h * 0.9,
			x + w * 0.5,
			y - h * 0.34,
			x - w * 0.06,
			y - h * 0.2,
			x - w * 0.62,
			y - h * 0.42
		]).fill(STONE.lit)

		// Shaded right side under the lit face.
		g.poly([
			x + w * 0.16,
			y - h * 0.9,
			x + w * 0.74,
			y - h * 0.42,
			x + w * 0.98,
			y + h * 0.02,
			x + w * 0.52,
			water + h * 0.16,
			x + w * 0.18,
			y - h * 0.16,
			x + w * 0.5,
			y - h * 0.34
		]).fill(STONE.dark)

		// Snow lying along the ridge, thicker on the windward (left) side.
		this.rect(g, x - w * 0.44, y - h - 1, w * 0.38, 2, this.palette.snowLight, 0.95)
		this.rect(g, x - w * 0.06, y - h * 0.94, w * 0.26, 1, this.palette.snowLight, 0.85)
		this.rect(g, x - w * 0.66, y - h * 0.6, w * 0.2, 1, this.palette.snowLight, 0.7)
		this.rect(g, x - w * 0.24, y - h * 0.99, 2, 1, this.palette.snow, 0.8)

		// Wet stone below the waterline, then the waterline itself.
		g.poly([
			x - w * 0.7,
			water,
			x + w * 0.6,
			water - h * 0.06,
			x + w * 0.52,
			water + h * 0.16,
			x - w * 0.68,
			water + h * 0.2
		]).fill({ color: this.palette.waterFar, alpha: 0.4 })
		g.moveTo(x - w * 0.72, water)
			.lineTo(x + w * 0.62, water - h * 0.06)
			.stroke({ width: 1, color: 0x0c2a3c, alpha: 0.5 })
		g.moveTo(x - w * 0.66, water + 1)
			.lineTo(x + w * 0.56, water - h * 0.06 + 1)
			.stroke({ width: 1, color: this.palette.ice, alpha: 0.45 })

		// Cracks in the stone: two short, angular lines.
		g.moveTo(x - w * 0.34, y - h * 0.46)
			.lineTo(x - w * 0.1, y - h * 0.28)
			.lineTo(x - w * 0.16, water - 1)
			.stroke({ width: 1, color: STONE.dark, alpha: 0.45 })
		g.moveTo(x + w * 0.2, y - h * 0.52)
			.lineTo(x + w * 0.34, y - h * 0.3)
			.stroke({ width: 1, color: STONE.dark, alpha: 0.35 })

		// Water torn by the upstream face, and a wake trailing downstream. The
		// current runs to the left, so the torn water is on the right face and the
		// wake trails away from it.
		g.moveTo(x + w * 1.0, water + h * 0.12)
			.lineTo(x + w * 0.7, water + h * 0.06)
			.stroke({ width: 1, color: this.palette.snowLight, alpha: 0.32 })
		for (let i = 0; i < 3; i += 1) {
			const wakeX = x - w * 0.96 - i * (w * 0.3 + 2)
			const wakeY = water + h * 0.02 + i * h * 0.16
			g.moveTo(wakeX, wakeY)
				.lineTo(wakeX - w * 0.46 - i * 3, wakeY + h * 0.12)
				.stroke({
					width: 1,
					color: this.palette.snowLight,
					alpha: 0.2 - i * 0.05
				})
		}
	}
}
