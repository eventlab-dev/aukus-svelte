import type { Graphics } from 'pixi.js'
import type { AreaPalette } from '../../areas'
import { VIEW } from '../../config'
import { randRange } from '../../utils'
import { mixColor } from '../../world'

/** One drifting patch of shade. */
interface Patch {
	x: number
	y: number
	rx: number
	ry: number
	/** Pixels per second to the right; both patches drift, never sit still. */
	speed: number
	phase: number
	alpha: number
}

/** Whole-pixel bands, so the rim of a patch keeps the pixel-art grain. */
const BAND = 2
const MARGIN = 70
const SPAN = VIEW.width + MARGIN * 2

function wrap(value: number): number {
	return ((((value + MARGIN) % SPAN) + SPAN) % SPAN) - MARGIN
}

/**
 * Cloud shadows: soft dark patches crawling over the whole scene in overcast
 * weather.
 *
 * They used to be drawn inside the water surface and clipped by the water test,
 * which made a shadow stop dead at the shoreline and at every prop — the boat,
 * the pier and the angler cut holes out of it, and the ragged per-row offset
 * turned the rim into a staircase. A cloud is overhead: its shade falls on the
 * land, the water and whatever stands on them, so the patches now live in a
 * layer above the scenery and are painted without any clipping.
 *
 * The shape is built from whole-pixel rows whose half-width follows the ellipse
 * with a slow wobble, which reads as a ragged cloud rather than a drawn oval
 * without ever stepping a row sideways by more than a pixel or two.
 */
export class CloudShadows {
	private readonly patches: Patch[] = []
	/** Dark version of the water's far end, pushed towards dusk. */
	private readonly color: number

	constructor(palette: AreaPalette) {
		this.color = mixColor(palette.waterFar, 0x06111c, 0.45)
		// Two shadows at most: a whole sky of clouds would read as a dirty screen.
		for (let i = 0; i < 2; i += 1) {
			this.patches.push({
				x: randRange(0, VIEW.width),
				y: randRange(40, VIEW.height - 40),
				rx: randRange(110, 170),
				ry: randRange(38, 62),
				speed: randRange(6, 11),
				phase: randRange(0, Math.PI * 2),
				alpha: i === 0 ? 0.26 : 0.19
			})
		}
	}

	/** Paints the patches for this frame; `cloudiness` 0..1 fades them in. */
	draw(g: Graphics, time: number, cloudiness: number): void {
		if (cloudiness <= 0.02) return

		for (const patch of this.patches) {
			const cx = wrap(patch.x + time * patch.speed)
			// A slow vertical drift keeps the patches from sliding like a printed
			// sheet, without ever moving a whole row in the frame.
			const cy = patch.y + Math.sin(time * 0.07 + patch.phase) * 5
			const top = Math.round(cy - patch.ry)
			const rows = Math.ceil((patch.ry * 2) / BAND)

			for (let row = 0; row < rows; row += 1) {
				const yTop = top + row * BAND
				const dy = (yTop + BAND / 2 - cy) / patch.ry
				if (Math.abs(dy) >= 1) continue
				// Two wobbles of different lengths: the half-width breathes like a cloud
				// instead of tracing a clean ellipse.
				const wobble =
					1 +
					0.16 * Math.sin(row * 0.5 + patch.phase) +
					0.07 * Math.sin(row * 1.27 + patch.phase * 1.8)
				const half = patch.rx * Math.sqrt(1 - dy * dy) * wobble
				const left = Math.round(cx - half)
				const right = Math.round(cx + half)
				if (right - left <= 0) continue
				// Smooth falloff from the rim to the middle, so no row's edge is a line.
				const profile = 0.15 + (1 - Math.abs(dy)) * 0.85
				g.rect(left, yTop, right - left, BAND).fill({
					color: this.color,
					alpha: patch.alpha * cloudiness * profile
				})
			}
		}
	}
}
