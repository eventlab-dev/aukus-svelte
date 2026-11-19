import { Container, Graphics, Sprite } from 'pixi.js'
import { C } from '../../../config'
import { drawGrassTuft } from '../grass'
import { drawFloatingLog } from '../logs'
import {
	SPRITE_PAD,
	drawContactShadow,
	drawReedClump,
	drawShoreStone,
	drawSnowDrift,
	paintContactShadow
} from '../props'
import { RiverBanks } from './RiverBanks'
import { TREE_BODY } from './geometry'

export class RiverScenery extends RiverBanks {
	drawScenery(props: Container): void {
		this.drawTrees(props)
		this.drawFarProps(props)
		this.drawNearProps(props)
		this.drawAnglerCape(props)
		this.drawLantern(props)
	}

	/**
	 * The drift a fir stands in, and the contact shadow on top of it.
	 *
	 * The drift is the snow the trunk grew out of — wider than the trunk, as snow
	 * piles are — while the shadow is the mark where the trunk actually meets it,
	 * in the same recipe the angler's own shadow uses. Drawn on its own the drift
	 * read as the tree's shadow and looked weaker than the player's.
	 */
	protected addMound(props: Container, x: number, base: number, scale: number): void {
		drawSnowDrift(props, x, base, scale, this.palette)
		drawContactShadow(props, x, base - SPRITE_PAD * scale, 6 * scale)
	}

	/**
	 * Every spruce on both banks, as sprites from the shared sheet.
	 *
	 * They are added to the prop layer rather than painted into the world
	 * Graphics: a Graphics cannot hold a texture, and `props` is sorted by the y
	 * of each base, which is exactly how the two drawn ranks used to be ordered.
	 * The tint does the aerial perspective — the back rank is nearly a silhouette,
	 * the near corner keeps the full colour of the sprite.
	 */
	protected drawTrees(props: Container): void {
		const trees = this.assets.trees
		if (trees.length === 0) return
		this.bankTrees.forEach((tree, index) => {
			const texture = trees[index % trees.length]
			const scale = tree.height / TREE_BODY
			if (tree.drift > 0) {
				this.addMound(props, tree.x, tree.base, tree.drift * 0.9)
			}
			const sprite = new Sprite(texture)
			sprite.anchor.set(0.5, 1)
			sprite.position.set(tree.x, tree.base)
			sprite.scale.set(tree.flip ? -scale : scale, scale)
			sprite.tint = tree.tint
			sprite.zIndex = tree.base
			props.addChild(sprite)
		})
	}

	protected drawFarProps(props: Container): void {
		// The far bank carries its spruces at full size (see `buildTrees`), so its
		// bushes are drawn at the same apparent size instead of a distant scale:
		// the bay's bushes sit between 0.8 and 1.1 of the sheet.
		for (const [x, scale] of [
			[196, 0.88],
			[268, 0.8],
			[356, 0.84]
		] as const) {
			// A shadow instead of the mound that used to be pushed up the bank:
			// centred on the waterline it spilled over the ice rim, and pushed back
			// it left the bush standing beside a grey oval of its own.
			const y = this.farAt(x) - 5
			this.addMound(props, x, y, scale * 0.5)
			const bush = new Sprite(this.assets.bushes[0] ?? this.assets.trees[1])
			bush.anchor.set(0.5, 1)
			bush.position.set(x, y)
			bush.scale.set(scale)
			bush.tint = 0x7d9a92
			bush.zIndex = y
			props.addChild(bush)
		}
	}

	protected drawNearProps(props: Container): void {
		// Reeds standing in the shallows of the near bank, in three clusters.
		//
		// They used to be one clump every fifty pixels along the waterline, which
		// read as a dotted rule following the bank. A few clumps together read as
		// reeds, and their feet sit a couple of pixels *inside* the waterline so
		// they grow out of the shallows instead of standing on dry snow.
		for (const [anchor, seed] of [
			[132, 1],
			[262, 4],
			[404, 7]
		] as const) {
			for (const [offset, lift] of [
				[-8, 0],
				[6, 2]
			] as const) {
				const x = anchor + offset
				drawReedClump(
					props,
					x,
					this.nearAt(x) - 3 - lift,
					this.palette,
					offset > 0 ? 1.07 : 0.95,
					seed + (offset > 0 ? 1 : 0)
				)
			}
		}
		for (const [x, flip] of [
			[72, 1],
			[128, -1],
			[200, 1],
			[318, -1],
			[398, 1],
			[466, -1]
		] as const) {
			drawGrassTuft(props, x, this.nearAt(x) + 14, 0x8f7a58, flip, 1.05)
		}

		// Boulders and driftwood on the bank.
		for (const [x, scale] of [
			[250, 1.05],
			[412, 0.85]
		] as const) {
			const y = this.nearAt(x) + 12
			this.addMound(props, x, y, scale * 0.55)
			drawShoreStone(props, x, y - 1, scale * 0.9, this.palette)
		}
		this.drawDriftwood(props, 246, this.nearAt(246) + 20)
		this.drawDriftwood(props, 360, this.nearAt(360) + 30)

		// A signpost on the bank, at the waterline.
		const sign = new Sprite(this.assets.sign)
		sign.anchor.set(0.5, 1)
		sign.position.set(176, this.nearAt(176) + 12)
		sign.rotation = -0.08
		sign.scale.set(1.1)
		sign.zIndex = this.nearAt(176) + 12
		props.addChild(sign)
		drawContactShadow(props, 176, this.nearAt(176) + 12, 6)
	}

	protected drawDriftwood(props: Container, x: number, y: number): void {
		// The same trunk drawing as the water, only dry: it lies on the snow, so it
		// takes the snow shading and a contact shadow instead of a waterline. The
		// shadow is the trunk's own long footprint, a pixel under it.
		drawContactShadow(props, x, y + 1, 15)
		const g = new Graphics()
		drawFloatingLog(
			g,
			{
				x,
				y,
				length: 38,
				angle: 0.08,
				rootRadius: 3.4,
				tipRadius: 2.6,
				submerged: 0,
				snow: 0.95,
				seed: Math.round(x)
			},
			this.palette
		)
		g.zIndex = y
		props.addChild(g)
	}

	/**
	 * The angler's snow spit: a shallow point that follows the near waterline and
	 * bulges upstream under his feet, so he never looks like he stands in water.
	 */
	protected drawAnglerCape(props: Container): void {
		const { x: anglerX, y: anglerY } = this.layout.angler
		const from = Math.round(anglerX - 34)
		const to = Math.round(anglerX + 38)
		const bulge = (x: number): number => {
			const t = (x - anglerX) / 34
			return Math.max(0, 1 - t * t) * 13
		}

		const points: number[] = []
		for (let x = from; x <= to; x += 2) points.push(x, this.nearAt(x) + 5)
		for (let x = to; x >= from; x -= 2) {
			points.push(x, this.nearAt(x) - bulge(x))
		}
		const g = new Graphics()
		g.poly(points).fill(this.palette.snowShade)
		const inner: number[] = []
		for (let x = from + 3; x <= to - 3; x += 2) {
			inner.push(x, this.nearAt(x) + 4)
		}
		for (let x = to - 3; x >= from + 3; x -= 2) {
			inner.push(x, this.nearAt(x) - bulge(x) + 3)
		}
		g.poly(inner).fill(this.palette.snow)
		// Wet ice along the upstream edge of the point.
		g.moveTo(from + 4, this.nearAt(from + 4) - bulge(from + 4) + 2)
		for (let x = from + 6; x <= to - 4; x += 2) {
			g.lineTo(x, this.nearAt(x) - bulge(x) + 2)
		}
		g.stroke({ width: 2, color: this.palette.ice, alpha: 0.7 })
		g.zIndex = anglerY - 0.6
		props.addChild(g)

		// One pale stone on the point. There used to be a second, dark one at
		// `anglerX + 26`: a flat grey ellipse, shadow-shaped by accident, which read
		// as a loose shadow lying on the snow. The pale one at his other side is a
		// snow-capped pebble, not a smudge.
		const stones = new Graphics()
		stones.ellipse(anglerX - 24, this.nearAt(anglerX - 24) + 2, 5, 1.8).fill({
			color: this.palette.snowLight,
			alpha: 0.8
		})
		stones.zIndex = anglerY - 0.5
		props.addChild(stones)
	}

	protected drawLantern(props: Container): void {
		const light = this.layout.light
		if (!light) return
		const x = light.x
		const y = light.y
		const g = new Graphics()
		// The post stands in the middle of its own shadow: the pale ellipse that
		// used to sit a pixel right and a pixel down left the lantern hanging off
		// the top-right of its own shade.
		paintContactShadow(g, x, y, 4.5)
		// Same rule as the other two banks: the glass hangs on the flame row that
		// the glow is lit from, so the halo sits on the light and not on the post.
		const glassTop = Math.round(light.glowY - 3)
		g.rect(x - 1, y - 12, 2, 12).fill(C.brownDark)
		g.rect(x - 1, y - 12, 1, 12).fill(C.brownLight)
		g.rect(x - 4, y - 13, 8, 2).fill(C.ink)
		g.rect(x - 3, y - 14, 6, 1).fill(this.palette.snow)
		g.rect(x - 3, glassTop, 6, 6).fill({ color: C.ink, alpha: 0.92 })
		g.rect(x - 2, glassTop + 1, 4, 4).fill({ color: 0x34321f, alpha: 0.95 })
		g.rect(x - 3, glassTop + 6, 6, 1).fill(C.brownDark)
		g.zIndex = y
		props.addChild(g)
	}
}
