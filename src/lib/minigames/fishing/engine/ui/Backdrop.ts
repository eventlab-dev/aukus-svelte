import { Container, Graphics, Rectangle, Sprite, type Texture } from 'pixi.js'
import { VIEW } from '../config'
import type { AreaDef } from '../areas'
import type { WorldClock } from '../world'
import { Atmosphere } from '../game/Atmosphere'
import { CURSORS } from '../cursors'
import { UI } from './palette'

/**
 * Static screenshot of the selected water body, dressed with live weather,
 * light and a vignette. Used behind menus, help and the codex.
 */
export class Backdrop extends Container {
	private readonly atmosphere = new Atmosphere()

	constructor(preview: Texture, clock: WorldClock, area: AreaDef) {
		super()

		// Menus have no full-screen input catcher of their own, so the backdrop
		// becomes the hover target that carries the custom default cursor.
		this.eventMode = 'static'
		this.hitArea = new Rectangle(0, 0, VIEW.width, VIEW.height)
		this.cursor = CURSORS.default

		const background = new Sprite(preview)
		background.width = VIEW.width
		background.height = VIEW.height
		background.eventMode = 'none'
		this.addChild(background)

		this.atmosphere.setMood(area.mood)
		this.atmosphere.setLight(area.layout.light?.x ?? null, area.layout.light?.glowY ?? null)
		// The backdrop shows the same screenshot the round starts with, so the fog
		// pocket has to sit on the angler in that picture too.
		this.atmosphere.setFocus(area.layout.angler.x, area.layout.angler.y)
		this.atmosphere.setWorld(clock.palette, clock.weatherDefFor(area.id))
		this.addChild(this.atmosphere)

		// Menus sit on a flat indigo scrim with a lavender wash: the reference
		// interface lives on a dark violet scene, and the bright snow would
		// otherwise swallow the light periwinkle controls. Two flat fills, no
		// gradient — the pixel grid stays visible.
		const scrim = new Graphics()
		scrim
			.rect(0, 0, VIEW.width, VIEW.height)
			.fill({ color: UI.scrim, alpha: 0.45 })
			.rect(0, 0, VIEW.width, VIEW.height)
			.fill({ color: UI.periwinkle, alpha: 0.1 })
		scrim.eventMode = 'none'
		this.addChild(scrim)

		// Soft vignette so panels read clearly.
		const vignette = new Graphics()
		for (let i = 0; i < 5; i += 1) {
			const alpha = 0.1 - i * 0.016
			vignette.rect(i * 10, i * 6, VIEW.width - i * 20, VIEW.height - i * 12).stroke({
				width: 10,
				color: UI.ink,
				alpha
			})
		}
		vignette.rect(0, 0, VIEW.width, VIEW.height).fill({ color: UI.ink, alpha: 0.3 })
		this.addChild(vignette)
	}

	update(dt: number): void {
		this.atmosphere.update(dt)
	}
}
