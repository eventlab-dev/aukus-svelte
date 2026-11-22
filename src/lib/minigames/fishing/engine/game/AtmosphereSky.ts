import { VIEW } from '../config'
import { WINTER, mixColor } from '../world'
import { clamp } from '../utils'
import { AtmosphereBase } from './AtmosphereBase'

export class AtmosphereSky extends AtmosphereBase {
	protected drawWash(): void {
		const g = this.wash
		g.clear()
		if (this.world.overlayAlpha > 0.002) {
			g.rect(0, 0, VIEW.width, VIEW.height).fill({
				color: this.world.overlay,
				alpha: this.world.overlayAlpha
			})
		}
		if (this.mood.overlayAlpha > 0.002) {
			g.rect(0, 0, VIEW.width, VIEW.height).fill({
				color: this.mood.overlay,
				alpha: this.mood.overlayAlpha
			})
		}
		const dark = this.visual.dark + this.mood.dark
		if (dark > 0.002) {
			g.rect(0, 0, VIEW.width, VIEW.height).fill({
				color: 0x050b1c,
				alpha: dark * 0.5
			})
		}
		// A grey lid over the whole frame: an overcast sky is not just a bit
		// darker, it drains the colour out of the snow and the water.
		const cloud = this.visual.cloud
		if (cloud > 0.02) {
			g.rect(0, 0, VIEW.width, VIEW.height).fill({
				color: 0x6d8296,
				alpha: cloud * 0.13
			})
		}
	}

	protected drawGlow(): void {
		const g = this.glow
		g.clear()
		const lantern = this.world.lantern
		if (lantern <= 0.02 || this.lightX === null || this.lightY === null) return

		// Warm pool of light around the area's lamp/fire. Several low-alpha rings
		// read as a soft wash instead of hard circles. The position handed in is
		// the flame itself, so this wash and the scene's own glow agree.
		const x = this.lightX
		const y = this.lightY
		for (let i = 0; i < 8; i += 1) {
			const t = i / 7
			const radius = 44 * (1 - t * 0.82)
			const alpha = (0.008 + t * 0.03) * lantern
			g.circle(x, y, radius).fill({
				color: t < 0.35 ? 0xffb347 : t < 0.7 ? 0xffc76b : 0xffe3a8,
				alpha
			})
		}
	}

	/**
	 * Fog is a framing device now, not a full-frame wash: dark cloud banks close
	 * in from the edges and leave a clearing around the water the player is
	 * fishing. Heavy weather thickens the banks instead of greying everything out.
	 */
	/**
	 * Fog is its own weather, not a permanent dressing: the other fronts keep the
	 * plain scene, and only a fog front pulls the bank in around the angler. The
	 * density ramps in over the front's own blend, so the layer creeps up instead
	 * of popping on.
	 */
	protected updateFog(dt: number): void {
		const density = clamp((this.visual.fog - 0.3) / 0.7)
		// Pale frozen air, not a dark cloud: winter fog is lit from above, so it
		// reads as a bright wash that swallows the far bank. A dark tint over dark
		// water looked like a dimmed screen instead of mist, and pure snow white
		// was brighter than the snow itself.
		this.fog.setDensity(density, mixColor(WINTER.snow, 0x93aebd, 0.38))
		this.fog.tick(dt)
	}
}
