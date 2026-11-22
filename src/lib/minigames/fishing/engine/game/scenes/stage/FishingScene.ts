import type { Container } from 'pixi.js'
import { liveWaterLayer } from '../pixelWater'
import { CatchLayer } from './CatchLayer'

export class FishingScene extends CatchLayer {
	get bobberPosition(): { x: number; y: number } {
		return { x: this.bobber.x, y: this.bobber.y }
	}

	/** Where the bobber settled after the cast. */
	get castPoint(): { x: number; y: number } {
		return { x: this.bobberBaseX, y: this.bobberBaseY }
	}

	/** The float view, moved above the fight fish while the fight is active. */
	get bobberView(): Container {
		return this.bobber
	}

	/** Put the float back into the lake layer after the fight. */
	restoreBobber(): void {
		if (this.bobber.parent !== this) this.addChild(this.bobber)
	}

	/** True when a virtual-screen point is open water, not shore or pier. */
	isWaterAt(x: number, y: number): boolean {
		return this.renderer.isWater(x, y)
	}

	/** The body's current direction and speed, for the aurora reflection. */
	get current(): { x: number; y: number } {
		const flow = liveWaterLayer()?.current
		return flow ? { x: flow.x, y: flow.y } : { x: 0, y: 0 }
	}

	update(dt: number): void {
		this.time += dt
		// Same time constant as the atmosphere's weather blend, so the shadows
		// arrive with the grey sky instead of before it.
		const k = 1 - Math.exp(-dt / 3.5)
		this.cloudiness += (this.cloudTarget - this.cloudiness) * k
		this.drawLight()
		this.updateAngler(dt)
		this.updateAmbient(dt)
		this.updateCast(dt)
		this.updateParticles(dt)
		this.updateJumps(dt)
		this.updateHeldFish(dt)
		this.renderer.drawMotion(this.motionG, this.time)
		// Textured water drifts on the same clock as the crests, one step apart: the
		// caustics are under the surface, so they are advanced first.
		this.renderer.updateWater?.(this.time)
		// Cloud shade goes over the props, so it is drawn on its own layer after
		// them rather than inside the water motion.
		this.clouds.clear()
		this.cloudShadows.draw(this.clouds, this.time, this.cloudiness)
		this.renderer.animate?.(this.time)
	}
}
