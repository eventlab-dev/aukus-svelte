import { Container, Graphics, Sprite } from 'pixi.js'
import { C, VIEW } from '../../../config'
import { drawGrassTuft } from '../grass'
import {
	SPRITE_PAD,
	drawContactShadow,
	drawShoreStone,
	drawSnowDrift,
	paintContactShadow
} from '../props'
import { mixColor, winterWaterAt } from '../../../world'
import { CoveShore } from './CoveShore'
import { DOCK, MOORED_BOAT, SHORE_X, type ScenerySpot } from './geometry'

export class CoveScenery extends CoveShore {
	drawScenery(props: Container): void {
		// The pier is a prop so the water surface, the shoal and the weather rings
		// all stay behind it. Its zIndex is the deck's top edge: everything that
		// stands on the pier (angler, moored boat) sorts above it by y.
		const dock = new Graphics()
		this.drawDock(dock)
		dock.zIndex = DOCK.y
		props.addChild(dock)

		const addMound = (item: ScenerySpot, scale: number): void => {
			drawSnowDrift(props, this.driftX(item.x, item.y, scale), item.y, scale, this.palette)
		}

		const treeSpots: ScenerySpot[] = [
			{ x: 29, y: 78, scale: 1.1, flip: false },
			{ x: 26, y: 172, scale: 0.95, flip: true },
			{ x: 32, y: 266, scale: 1.15, flip: false },
			// The upper spruce of the pair stood at (46, 58): its right side hung a
			// good eight pixels over the shoreline, so the canopy read as growing out
			// of the ice rim. It now stands up the bank in the top-left corner, left
			// of the bigger tree and clear of the water.
			{ x: 16, y: 46, scale: 0.8, flip: true }
		]
		treeSpots.forEach((item, index) => {
			addMound(item, item.scale)
			// The drift is the snow the tree grew out of; the shadow is the contact
			// it makes with that snow, in the same recipe the angler uses.
			drawContactShadow(props, item.x, item.y - SPRITE_PAD * item.scale, 6.5 * item.scale)
			const texture = this.assets.trees[index % this.assets.trees.length]
			const sprite = new Sprite(texture)
			sprite.anchor.set(0.5, 1)
			sprite.position.set(item.x, item.y)
			sprite.scale.set(item.flip ? -item.scale : item.scale, item.scale)
			sprite.zIndex = item.y
			props.addChild(sprite)
		})

		const bushSpots: ScenerySpot[] = [
			{ x: 10, y: 108, scale: 1.1 },
			{ x: 40, y: 116, scale: 0.8 },
			{ x: 18, y: 214, scale: 1.1 },
			{ x: 46, y: 230, scale: 0.9 }
		]
		bushSpots.forEach((item, index) => {
			addMound(item, item.scale * 0.7)
			drawContactShadow(props, item.x, item.y - SPRITE_PAD * item.scale, 5.5 * item.scale)
			const texture = this.assets.bushes[index % this.assets.bushes.length]
			const sprite = new Sprite(texture)
			sprite.anchor.set(0.5, 1)
			sprite.position.set(item.x, item.y)
			sprite.scale.set(item.scale)
			sprite.zIndex = item.y
			props.addChild(sprite)
		})

		const rockSpots: ScenerySpot[] = [
			{ x: 36, y: 198, scale: 1 },
			{ x: 24, y: 62, scale: 0.9 },
			{ x: 48, y: 248, scale: 0.8 }
		]
		rockSpots.forEach((item) => {
			drawSnowDrift(
				props,
				this.driftX(item.x, item.y, item.scale * 0.6),
				item.y,
				item.scale * 0.6,
				this.palette
			)
			drawShoreStone(props, item.x, item.y - 1, item.scale * 0.85, this.palette)
		})

		this.drawMooredBoat(props)
		this.drawCoveExtras(props)
		this.drawLanternBody(props)
	}

	/**
	 * The rowboat, tied along the underside of the pier. It sits low in the
	 * water: the submerged slice of the hull is repainted with the local water
	 * colour, a foam seam marks the waterline and the whole hull rocks with the
	 * swell in {@link animate}.
	 *
	 * The sprite ships with a pale water band under the keel, which in the scene
	 * read as a white shelf. It is now covered with water, and the shadow is the
	 * hull's own rounded footprint pushed under the waterline instead of an
	 * ellipse floating next to the boat.
	 */
	protected drawMooredBoat(props: Container): void {
		const { x, y } = MOORED_BOAT
		const water = winterWaterAt((x - SHORE_X) / (VIEW.width - SHORE_X), this.palette.waterStops)

		const boat = new Container()
		boat.position.set(x, y)
		boat.rotation = 0.015

		// Contact shadow, drawn behind the hull: a soft stack that hugs the keel
		// and fades outward, instead of one hard ellipse floating next to the boat.
		const shadow = new Graphics()
		shadow.roundRect(-20.4, 6.0, 40.8, 3.2, 1.6).fill({ color: 0x061c2b, alpha: 0.3 })
		shadow.roundRect(-18.6, 7.4, 37.2, 3.4, 1.7).fill({ color: 0x061c2b, alpha: 0.16 })
		shadow.roundRect(-15.4, 9.0, 30.8, 3.2, 1.6).fill({ color: 0x061c2b, alpha: 0.08 })
		boat.addChild(shadow)

		const hull = new Sprite(this.assets.boat[0] ?? this.assets.boat[1])
		hull.anchor.set(0.5, 0.55)
		// Same drawn size as the lake's boat: both are frames of the one 64 px
		// rowboat sheet, so they must not read as two different vessels.
		hull.scale.set(0.66)
		boat.addChild(hull)

		// The pale band under the keel is the boat's painted boot stripe, not
		// water: it belongs to the hull. What sells the waterline is the dark seam
		// at its lower edge plus a soft contact shadow spreading under the hull.
		// Repainting the stripe in water colours turned it into a white shelf.
		const contact = mixColor(water, this.palette.waterFar, 0.6)
		const wash = new Graphics()
		wash.roundRect(-19.8, 6.2, 39.6, 1.1, 0.5).fill({ color: contact, alpha: 0.55 })
		// Water lapping at the hull: a few broken ticks instead of a solid line.
		for (const [tx, tw] of [
			[-14, 5],
			[-4, 7],
			[7, 4],
			[13, 3]
		] as const) {
			wash.roundRect(tx, 6.0, tw, 0.7, 0.35).fill({ color: this.palette.snowLight, alpha: 0.3 })
		}
		boat.addChild(wash)

		// Two thwarts and a stowed oar: the hull reads as an open rowboat instead
		// of a floating box.
		const gear = new Graphics()
		gear.rect(-16, -6.5, 32, 2).fill({ color: 0x6a4a33, alpha: 0.9 })
		gear.rect(-16, 0.5, 32, 2).fill({ color: 0x5b3f2c, alpha: 0.9 })
		gear.moveTo(-13, -8).lineTo(19, 3).stroke({ width: 1, color: 0x8a6a4a, alpha: 0.85 })
		gear.moveTo(-13, -8).lineTo(-8, -9.5).stroke({ width: 2, color: 0x8a6a4a, alpha: 0.85 })
		boat.addChild(gear)

		// The mooring rope runs up to the nearest pier post.
		const rope = new Graphics()
		rope
			.moveTo(-20, -6)
			.quadraticCurveTo(-25, -15, -18, -24)
			.stroke({ width: 1, color: 0xc9b184, alpha: 0.7 })
		boat.addChild(rope)

		boat.zIndex = y
		props.addChild(boat)
		this.boat = boat
	}

	/**
	 * Swell: the moored hull rolls with the water.
	 *
	 * It used to bob vertically by ±1.4 px as well, but the renderer rounds
	 * sprite positions, so a slow subpixel sine became a hold and a one-pixel
	 * jump — the boat read as stuttering in place. Rotation is not rounded, so
	 * the roll alone carries the swell smoothly.
	 */
	animate(time: number): void {
		if (!this.boat) return
		this.boat.rotation = Math.sin(time * 1.1 + 0.6) * 0.028
	}

	protected drawCoveExtras(props: Container): void {
		// A signpost between the bank trees.
		const sign = new Sprite(this.assets.sign)
		sign.anchor.set(0.5, 1)
		sign.position.set(30, 120)
		sign.scale.set(1.15)
		sign.zIndex = 120
		props.addChild(sign)
		drawContactShadow(props, 30, 120, 6 * 1.15)

		for (const [x, y, flip] of [
			[24, 152, 1],
			[18, 208, -1],
			[20, 250, 1],
			[48, 240, -1]
		] as const) {
			drawGrassTuft(props, x, y, 0x8f7a58, flip, 1.1)
		}
	}

	protected drawLanternBody(props: Container): void {
		const light = this.layout.light
		if (!light) return
		const x = light.x
		const y = light.y
		const g = new Graphics()
		// The post stands in the middle of its own shadow, in the shared recipe:
		// the pale half-ellipse that used to sit a pixel below it read as a stone.
		paintContactShadow(g, x, y, 4.5)
		// Glass centred on the flame row the glow is lit from, as on the other two
		// waters: the halo used to sit low because the fixture and the light each
		// carried their own idea of where the flame was.
		const glassTop = Math.round(light.glowY - 2.5)
		g.rect(x - 1, y - 8, 2, 8).fill(C.brownDark)
		g.rect(x - 1, y - 8, 1, 8).fill(C.brownLight)
		g.rect(x - 4, y - 11, 8, 2).fill(C.ink)
		g.rect(x - 3, y - 12, 6, 1).fill(this.palette.snow)
		g.rect(x - 3, glassTop, 6, 5).fill({ color: C.ink, alpha: 0.92 })
		g.rect(x - 2, glassTop + 1, 4, 3).fill({ color: 0x34321f, alpha: 0.95 })
		g.rect(x - 3, glassTop + 5, 6, 1).fill(C.brownDark)
		g.zIndex = y
		props.addChild(g)
	}

	// ----------------------------------------------------------------- motion
}
