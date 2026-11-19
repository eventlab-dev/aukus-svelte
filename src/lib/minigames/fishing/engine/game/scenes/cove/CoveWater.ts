import { Graphics } from 'pixi.js'
import { CoveBase } from './CoveBase'

/**
 * The bay's water is drawn by the shared surface (baked caustics, glitter and
 * foam in `pixelWater`) and by the moving crests in `WaterSurface`. This layer
 * only paints what is frozen into the water itself: the slush and drift ice.
 *
 * It used to carry a painted field of wavelets, breaking crests, static
 * sparkles, sleeping ripples and a fixed foam line. Those were the stand-in for
 * a living surface before there was one, and once the real caustics and foam
 * arrived they read as engraving on the water: lines that never move under a
 * surface that does. They are gone.
 */
export class CoveWater extends CoveBase {
	protected drawIce(g: Graphics, x: number, y: number, width: number, height: number): void {
		g.ellipse(x, y, width, height).fill({
			color: this.palette.iceDeep,
			alpha: 0.3
		})
		g.ellipse(x, y - 0.8, width * 0.92, height * 0.72).fill({
			color: this.palette.ice,
			alpha: 0.6
		})
		g.ellipse(x - width * 0.16, y - 1.2, width * 0.42, height * 0.36).fill({
			color: this.palette.snowLight,
			alpha: 0.7
		})
		g.rect(x - width * 0.35, y + height * 0.15, width * 0.7, 1).fill({
			color: this.palette.iceDeep,
			alpha: 0.45
		})
	}
}
