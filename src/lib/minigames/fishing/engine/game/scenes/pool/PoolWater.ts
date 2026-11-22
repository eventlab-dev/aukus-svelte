import { Container, Graphics } from 'pixi.js'
import { VIEW } from '../../../config'
import { winterWaterAt } from '../../../world'
import { drawFloatingLog } from '../logs'
import { PoolBase } from './PoolBase'
import { CENTER, DEPTH_LAYERS, RADIUS } from './geometry'

export class PoolWater extends PoolBase {
	drawWorld(g: Graphics): void {
		// The clearing is deep snow: the lake is a hole cut into the snowfield,
		// so the bank matches the river and the bay at the water's edge and the
		// ground around the trees reads as snow instead of dark forest floor.
		g.rect(0, 0, VIEW.width, VIEW.height).fill(this.palette.snow)

		// Wind drifts across the field used to be painted here: 34 pairs of pale
		// ellipses, meant as relief. On white snow they read as flat grey ovals
		// scattered over the field — stray shadows with nothing above them to cast
		// them — so the field stays clean and every fir, bush, stone and reed on it
		// casts its own contact shadow instead.
		for (let i = 0; i < 18; i += 1) {
			const x = 20 + ((i * 53) % (VIEW.width - 40))
			const y = 18 + ((i * 71) % (VIEW.height - 36))
			if ((x + y) % 5 !== 0) continue
			g.rect(x, y, 1, 1).fill({
				color: this.palette.snowLight,
				alpha: 0.9
			})
		}

		// Snow slides into the hole: a shaded shoulder, a bright lip and the ice
		// that has pushed out over the water. The rings follow the same noisy
		// outline as the water, so the bank never looks like a plotted ellipse.
		g.poly(this.shorePolygon(0.13)).fill({
			color: this.palette.snowShade,
			alpha: 0.75
		})
		g.poly(this.shorePolygon(0.065)).fill(this.palette.snow)
		g.poly(this.shorePolygon(0.025)).fill(this.palette.snowLight)
		g.poly(this.shorePolygon(0.004)).fill(this.palette.iceDeep)

		// Depth contours: the shoreline blends into an off-centre basin, so the
		// dark water sits to one side and the shelf is wider on the other. Every
		// contour is dithered, so the one-unit step between neighbours scatters
		// into water grain instead of reading as a staircase.
		for (let i = 0; i < DEPTH_LAYERS; i += 1) {
			const t = i / (DEPTH_LAYERS - 1)
			g.poly(this.depthPolygon(t)).fill(winterWaterAt(t, this.palette.waterStops))
		}
		g.poly(this.shorePolygon(0.012)).stroke({
			width: 2,
			color: this.palette.ice,
			alpha: 0.85
		})
		g.poly(this.shorePolygon(0.002)).stroke({
			width: 1,
			color: this.palette.snowLight,
			alpha: 0.5
		})

		// Loose stones and snow clumps break the silhouette further.
		for (let i = 0; i < 18; i += 1) {
			const angle = (i / 18) * Math.PI * 2 + 0.13
			const scale = this.shoreScale(angle) + 0.03
			const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
			const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
			g.ellipse(x, y, 4 + (i % 3) * 2, 2 + (i % 2)).fill({
				color: i % 3 === 0 ? this.palette.snowShade : this.palette.iceDeep,
				alpha: 0.75
			})
			if (i % 2 === 0) {
				g.ellipse(x - 1, y - 1, 2.5, 1.2).fill({
					color: this.palette.snowLight,
					alpha: 0.8
				})
			}
		}

		// The lake's living surface is drawn above this layer (`pixelWater`), so the
		// pale dashes that used to stand in for a moon path here are gone: a row of
		// static strokes down the middle of the water read as a painted ladder
		// under the caustics. What stays is what is actually on the lake — the ice
		// discs below.

		for (const disc of this.discs) {
			g.ellipse(disc.x, disc.y, disc.rx, disc.ry).fill({
				color: this.palette.ice,
				alpha: disc.alpha
			})
			g.ellipse(disc.x - disc.rx * 0.2, disc.y - 0.5, disc.rx * 0.5, disc.ry * 0.5).fill({
				color: this.palette.snowLight,
				alpha: disc.alpha * 0.8
			})
		}
	}

	/**
	 * The floating trunks, each in its own container so it can ride the chop
	 * without the rest of the lake being repainted.
	 *
	 * They used to be part of the painted background: a still lake with three
	 * logs frozen into it, which made them read as decals on the water rather
	 * than as wood the lake is carrying.
	 */
	drawFloating(layer: Container): void {
		this.logs.forEach((log, index) => {
			const node = new Container()
			node.position.set(log.x, log.y)
			const g = new Graphics()
			// Drawn at the container's own origin; the placement lives on the node.
			drawFloatingLog(g, { ...log, x: 0, y: 0 }, this.palette)
			node.addChild(g)
			layer.addChild(node)
			this.trunks.push({
				node,
				baseX: log.x,
				baseY: log.y,
				// A different phase and pace per trunk: three logs bobbing in lockstep
				// would read as one animation, not as three objects on the water.
				phase: index * 2.1 + 0.35,
				speed: 0.42 + index * 0.05,
				roll: 0.011 + index * 0.004
			})
		})
	}

	/** Heave, drift and roll of the trunks; the lake is calm, so all three stay small. */
	animate(time: number): void {
		for (const trunk of this.trunks) {
			const t = time * trunk.speed + trunk.phase
			trunk.node.y = trunk.baseY + Math.sin(t) * 0.7
			trunk.node.x = trunk.baseX + Math.sin(t * 0.47 + 1.1) * 0.6
			trunk.node.rotation = Math.sin(t * 0.72 + 0.4) * trunk.roll
		}
	}
}
