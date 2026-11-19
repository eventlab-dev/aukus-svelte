import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { C, VIEW } from '../../../config'
import { mixColor } from '../../../world'
import { ditherNoise } from '../dither'
import { drawGrassTuft } from '../grass'
import {
	SPRITE_PAD,
	drawContactShadow,
	drawReedClump,
	drawShoreStone,
	drawSnowDrift
} from '../props'
import { PoolWater } from './PoolWater'
import { CENTER, RADIUS } from './geometry'

export class PoolScenery extends PoolWater {
	drawScenery(props: Container): void {
		this.drawShoreReeds(props)

		// Dense ring of snowy firs and rocks follows the ragged shoreline.
		const trees = this.assets.trees
		for (let i = 0; i < 26; i += 1) {
			const angle = (i / 26) * Math.PI * 2 + 0.18
			const scale = this.shoreScale(angle) + 0.1
			const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
			const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
			const size = 0.72 + ((i * 7) % 5) * 0.09
			const texture = trees[i % trees.length]
			// The near bank stands in front of the angler (z-sorted by its base), and
			// the bottom-centre fir put its canopy straight over his head and rod.
			// His mooring is a clearing: no foreground tree is planted on his column.
			if (this.hidesAngler(x, y, size, texture)) continue
			this.placeDrift(props, x, y, size)
			const sprite = new Sprite(texture)
			sprite.anchor.set(0.5, 1)
			sprite.position.set(x, y)
			sprite.scale.set(size)
			sprite.tint = 0x9fb3a8
			sprite.zIndex = y
			props.addChild(sprite)
		}

		// A second, darker row of firs out on the snowfield, behind that ring. The
		// lake fills most of the frame, so candidates that fall on the water or off
		// the frame are dropped: what is left lands in the corners and the side
		// strips, which is where the open snowfield actually is.
		const backTrees: Array<{ x: number; y: number }> = []
		for (let i = 0; i < 34; i += 1) {
			const angle = (i / 34) * Math.PI * 2 + 0.52
			const jitter = ditherNoise(i + 3, 71)
			const spread = this.shoreScale(angle) + 0.17 + Math.abs(jitter) * 0.13
			const x = CENTER.x + Math.cos(angle) * RADIUS.x * spread
			const y = CENTER.y + Math.sin(angle) * RADIUS.y * spread
			if (x < 12 || x > VIEW.width - 12) continue
			if (y < 14 || y > VIEW.height - 4) continue
			// Keep the row from collapsing into one blob where the outline is tight.
			if (backTrees.some((tree) => Math.hypot(tree.x - x, tree.y - y) < 15)) {
				continue
			}
			backTrees.push({ x, y })
			const size = 0.78 + Math.abs(jitter) * 0.42
			if (this.hidesAngler(x, y, size, trees[i % trees.length])) continue
			this.placeDrift(props, x, y, size * 0.9)
			const sprite = new Sprite(trees[i % trees.length])
			sprite.anchor.set(0.5, 1)
			sprite.position.set(x, y)
			sprite.scale.set(size)
			// A touch darker and bluer, so the new row sits behind the lit front one.
			sprite.tint = 0x83968d
			sprite.zIndex = y
			props.addChild(sprite)
		}

		// The four corners of the clearing: the lake's ragged hole leaves bare snow
		// there, and the ring of firs follows the bank rather than the frame, so the
		// corners stayed empty. These are placed by hand, outside the water outline.
		const corners: Array<[number, number, number]> = [
			[17, 34, 0.95],
			[54, 15, 0.8],
			[25, 70, 0.7],
			[462, 33, 0.95],
			[428, 17, 0.78],
			[16, 246, 0.9],
			[50, 264, 0.82],
			[466, 250, 0.9],
			[432, 266, 0.75]
		]
		for (const [x, y, size] of corners) {
			this.placeDrift(props, x, y, size * 0.9)
			const sprite = new Sprite(trees[Math.round(x + y) % trees.length])
			sprite.anchor.set(0.5, 1)
			sprite.position.set(x, y)
			sprite.scale.set(size)
			// The same darker tint as the back row: these read as the forest edge.
			sprite.tint = 0x83968d
			sprite.zIndex = y
			props.addChild(sprite)
		}

		// Stones on the bank, drawn rather than pasted: the pack's rock sprite read
		// as a bomb with spikes next to the hand-built firs.
		for (let i = 0; i < 8; i += 1) {
			const angle = (i / 8) * Math.PI * 2 + 0.9
			const scale = this.shoreScale(angle) + 0.025
			const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
			const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
			const size = 0.8 + (i % 3) * 0.15
			this.placeDrift(props, x, y, size * 0.6)
			drawShoreStone(props, x, y - 1, size * 0.85, this.palette)
		}

		// A leaning warning sign and frost-burnt grass on the bank.
		this.drawShoreSign(props, 2.55)
		this.drawGrass(props, 3.35)
		this.drawGrass(props, 5.15)

		this.drawBoat(props)
		this.drawLampFixture(props)
	}

	/**
	 * A drift whose footprint stays on the bank, plus the trunk's own shadow.
	 *
	 * The firs of the near ring stand on the shoreline itself, so a mound drawn
	 * around a trunk could hang over the surface and read as snow afloat. The
	 * drift is nudged towards the middle of the lake, one pixel at a time, until
	 * every probe of its foot is dry — while the shadow stays on the trunk, in
	 * the same recipe as the angler's, so the tree is anchored even where the
	 * drift had to move.
	 */
	protected placeDrift(props: Container, x: number, base: number, scale: number): void {
		const half = 13 * scale
		const foot = 4.2 * scale
		const probes: Array<[number, number]> = [
			[half, 0],
			[-half, 0],
			[0, -foot],
			[half * 0.6, foot * 0.6],
			[-half * 0.6, foot * 0.6]
		]
		const wet = (px: number, py: number): boolean =>
			probes.some(([ox, oy]) => this.isWater(px + ox, py + oy))
		const inward = Math.hypot(CENTER.x - x, CENTER.y - base) || 1
		const ux = (CENTER.x - x) / inward
		const uy = (CENTER.y - base) / inward
		let cx = x
		let cy = base
		for (let step = 0; step < 24 && wet(cx, cy); step += 1) {
			cx += ux
			cy += uy
		}
		drawSnowDrift(props, cx, cy, scale, this.palette)
		drawContactShadow(props, x, base - SPRITE_PAD * scale, 6 * scale)
	}

	protected drawShoreSign(props: Container, angle: number): void {
		const scale = this.shoreScale(angle) + 0.08
		const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
		const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
		const sign = new Sprite(this.assets.sign)
		sign.anchor.set(0.5, 1)
		sign.position.set(x, y)
		sign.rotation = -0.12
		sign.scale.set(1.1)
		sign.zIndex = y
		props.addChild(sign)
		// The pale pile of snow that used to sit at the post's foot read as a
		// second, smaller sign lying on the bank; the post gets a shadow instead.
		drawContactShadow(props, x, y, 6)
	}

	protected drawGrass(props: Container, angle: number): void {
		const scale = this.shoreScale(angle) + 0.07
		const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
		const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
		drawGrassTuft(props, x, y, 0x8f7a58, 1, 1)
	}

	/**
	 * Reeds standing in the shallows where the bank meets the water.
	 *
	 * The lake's edge was bare snow between the firs: a still-water shore has
	 * cattails on the ice rim, and the clump drawing is shared with the river, so
	 * both waters grow the same plant. They stand in three clusters — upper left,
	 * the left foot of the hole and the right bank — instead of one clump every
	 * forty degrees around the lake: scattered singles read as a dotted ring,
	 * while a few clumps together read as reeds. Each clump is planted a couple of
	 * pixels *inside* the waterline, so it grows out of the shallows rather than
	 * standing on dry snow, and the angler's mooring stays open.
	 */
	protected drawShoreReeds(props: Container): void {
		const { x: anglerX, y: anglerY } = this.layout.angler
		// Cluster centres, in frame pixels. The clumps are planted around each one,
		// in the water nearest to it.
		const clusters: ReadonlyArray<{ x: number; y: number }> = [
			{ x: 80, y: 85 },
			{ x: 63, y: 139 },
			{ x: 429, y: 116 }
		]
		let seed = 0
		for (const cluster of clusters) {
			const base = Math.atan2((cluster.y - CENTER.y) / RADIUS.y, (cluster.x - CENTER.x) / RADIUS.x)
			// Three clumps per cluster, a few degrees apart along the bank, so the
			// group fans out instead of stacking on one point.
			for (const offset of [-0.06, 0, 0.06]) {
				const angle = base + offset
				seed += 1
				// Inside the outline: the clump's feet stand in the shallows, a few
				// pixels off the bank, with the water drawn over the bank behind them.
				const scale = this.shoreScale(angle) - 0.032 - (seed % 3) * 0.006
				const x = CENTER.x + Math.cos(angle) * RADIUS.x * scale
				const y = CENTER.y + Math.sin(angle) * RADIUS.y * scale
				if (x < 14 || x > VIEW.width - 14) continue
				if (y < 26 || y > VIEW.height - 10) continue
				if (Math.hypot(x - anglerX, y - anglerY) < 46) continue
				drawReedClump(props, x, y, this.palette, 0.95 + (seed % 3) * 0.14, seed)
			}
		}
	}

	/**
	 * True when a fir would stand between the camera and the angler.
	 *
	 * Props are z-sorted by their base line, so only a tree whose base is below
	 * the angler is drawn over him; such a tree can still be tall enough for its
	 * canopy to reach back up across his head and rod. Those are the ones the
	 * lake has to leave out of the near bank.
	 */
	protected hidesAngler(x: number, y: number, size: number, texture: Texture): boolean {
		const { angler } = this.layout
		if (y <= angler.y) return false
		const halfWidth = (texture.width * size) / 2
		const top = y - texture.height * size
		return x + halfWidth > angler.x - 18 && x - halfWidth < angler.x + 18 && top < angler.y - 4
	}

	protected drawBoat(props: Container): void {
		const { x, y } = this.layout.angler
		// Hull, snow and water shade share one container: the shadow then rocks
		// with the boat instead of staying screen-aligned.
		const boat = new Container()
		boat.position.set(x, y + 2)
		boat.rotation = -0.04
		boat.zIndex = y - 0.5
		props.addChild(boat)

		// The skiff is a narrow top-down hull, so its shadow is the hull's own
		// footprint pushed down-right, read only as a dark rim along the keel. The
		// old shadow was one 50×14 horizontal ellipse — six times wider than the
		// hull — which read as a hole punched in the lake rather than as water
		// shaded by the boat.
		const shade = mixColor(this.palette.waterStops[2].color, 0x020a10, 0.55)
		const shadow = new Graphics()
		shadow.roundRect(-6.8, -17.4, 15.6, 31.2, 3.6).fill({ color: shade, alpha: 0.14 })
		shadow.roundRect(-5.4, -16.1, 13.4, 29.2, 3.1).fill({ color: shade, alpha: 0.32 })
		boat.addChild(shadow)

		// Frame 1 is the vertical hull, which reads as a boat seen from above. It is
		// drawn at the same size as the bay's rowboat: one sheet, one drawn size.
		const hull = new Sprite(this.assets.boat[1] ?? this.assets.boat[0])
		hull.anchor.set(0.5, 0.58)
		hull.scale.set(0.66)
		boat.addChild(hull)

		// No snow patches on the gunwales: the two pale ellipses that used to sit
		// here read as ice floes lying on the hull, not as snow caught on the boat.
	}

	protected drawLampFixture(props: Container): void {
		const light = this.layout.light
		if (!light) return
		const g = new Graphics()
		const x = light.x
		const y = light.y
		// The post had no contact mark at all: it looked pasted on the snow.
		drawContactShadow(props, x, y, 5)
		// The glass is centred on the light's own flame row, not on a hard-coded
		// offset from the foot: the fixture and the halo it throws are fed the same
		// number, so re-hanging the lamp cannot leave its glow behind.
		const glassTop = Math.round(light.glowY - 2.5)
		g.rect(x - 1, y - 12, 2, 12).fill(C.brownDark)
		g.rect(x - 4, y - 15, 8, 2).fill(C.ink)
		g.rect(x - 3, glassTop, 6, 5).fill({ color: C.ink, alpha: 0.92 })
		g.rect(x - 2, glassTop + 1, 4, 3).fill({ color: 0x34321f, alpha: 0.95 })
		g.zIndex = y
		props.addChild(g)
	}

	// ----------------------------------------------------------------- motion
}
