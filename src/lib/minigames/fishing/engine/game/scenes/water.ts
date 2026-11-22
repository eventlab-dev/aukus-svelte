import type { Graphics } from 'pixi.js'
import type { AreaPalette } from '../../areas'
import { VIEW } from '../../config'
import { randRange } from '../../utils'

/**
 * A crest dash travelling on the surface: the thing that tells the eye the
 * water is moving even when the scene underneath is one flat depth ramp.
 */
interface Chop {
	/** Where the dash sits before it starts moving; wrapped every frame. */
	x: number
	y: number
	length: number
	/** Pixels per second along the surface. */
	speed: number
	phase: number
	/** How tall the crest peaks, in pixels. */
	lift: number
	alpha: number
	color: number
}

/** A long, very faint band of sky light sliding over the water. */
interface Sheen {
	x: number
	y: number
	rx: number
	ry: number
	speed: number
	phase: number
	alpha: number
}

/** A looping ripple ring: a drop, a bubble, a fish turning just under. */
interface Pop {
	x: number
	y: number
	phase: number
	period: number
	radius: number
}

export interface WaterSurfaceOptions {
	palette: AreaPalette
	/** The body's own water test, so motion never spills onto the bank. */
	isWater: (x: number, y: number) => boolean
	/**
	 * Drift of the surface, in pixels per second. Positive flows to the right,
	 * like the river's downstream current; the lake sits near zero.
	 */
	flow: number
	/** 0 (glassy lake) .. 1 (open sea chop): scales counts, lift and contrast. */
	energy?: number
	/** Travelling crests. */
	chops?: number
	/** Broad light bands. */
	sheens?: number
	/** Looping ripple rings. */
	pops?: number
	/** Horizontal bands the crests are laid out in: fewer rows, calmer water. */
	rows?: number
}

const SPAN = VIEW.width + 120
const MARGIN = 60

/** Wrap a drifting feature back into the frame with a margin on both sides. */
function wrap(value: number): number {
	const span = SPAN
	return ((((value + MARGIN) % span) + span) % span) - MARGIN
}

/**
 * The living surface of a water body.
 *
 * Every location used to paint a still field of wavelets and a couple of
 * ripples, so the water read as a printed backdrop while the snow and the
 * angler moved. This adds one layer drawn above the static world on every
 * frame: crest dashes carried by the current, broad light bands sliding over
 * the swell, sparkles that catch the light and ripple rings that open and
 * fade. Each area tunes `flow` and `energy`, so the lake barely breathes, the
 * river hurries downstream and the bay chops.
 *
 * Cloud shadows do not live here: they belong to the scene, above the props, so
 * a cloud can shade the bank, the boat and the water alike (see CloudShadows).
 */
export class WaterSurface {
	private readonly palette: AreaPalette
	private readonly isWater: (x: number, y: number) => boolean
	private readonly flow: number
	private readonly energy: number
	private readonly chops: Chop[] = []
	private readonly sheens: Sheen[] = []
	private readonly pops: Pop[] = []
	/** Dark half of the water, used for the trough under a crest. */
	private readonly trough: number

	constructor(options: WaterSurfaceOptions) {
		this.palette = options.palette
		this.isWater = options.isWater
		this.flow = options.flow
		this.energy = options.energy ?? 0.5
		this.trough = this.palette.waterFar

		const energy = this.energy
		const chopCount = options.chops ?? Math.round(26 + energy * 26)
		// Crests are laid out in loose horizontal bands instead of a random field.
		// A scattered field read as foam specks on the lake; rows read as swell.
		const rows = options.rows ?? Math.max(3, Math.round(4 + energy * 4))
		const band = (VIEW.height - 24) / rows

		for (let i = 0; i < chopCount; i += 1) {
			// The dashes are spread over the frame and drift from there; because the
			// speeds differ by В±25%, the field shears apart instead of sliding as a
			// printed sheet.
			const jitter = randRange(0.75, 1.25)
			const row = i % rows
			this.chops.push({
				x: randRange(-MARGIN, VIEW.width + MARGIN),
				y: 12 + row * band + randRange(-band * 0.28, band * 0.28),
				length: randRange(4, 10 + energy * 9),
				speed: this.flow * jitter,
				phase: randRange(0, Math.PI * 2),
				lift: randRange(0.6, 1 + energy * 1.1),
				alpha: randRange(0.045, 0.085) + energy * 0.045,
				color:
					i % 4 === 0 ? this.palette.snow : i % 3 === 0 ? this.palette.snowLight : this.palette.ice
			})
		}

		const sheenCount = options.sheens ?? 5
		for (let i = 0; i < sheenCount; i += 1) {
			this.sheens.push({
				x: randRange(0, VIEW.width),
				y: randRange(20, VIEW.height - 20),
				rx: randRange(40, 90),
				ry: randRange(5, 11),
				speed: this.flow * randRange(0.2, 0.42),
				phase: randRange(0, Math.PI * 2),
				alpha: randRange(0.014, 0.03)
			})
		}

		const popCount = options.pops ?? 6
		for (let i = 0; i < popCount; i += 1) {
			this.pops.push({
				x: randRange(20, VIEW.width - 20),
				y: randRange(20, VIEW.height - 20),
				phase: randRange(0, 1),
				period: randRange(4.5, 9),
				radius: randRange(4, 10)
			})
		}
	}

	/**
	 * True when the whole ellipse lies on open water.
	 *
	 * A ripple ring grows as it opens, so testing only the centre let it run over
	 * the pier, the bank and the snow behind it. The outline is what has to be
	 * dry, so the outline is what is asked.
	 */
	private insideWater(x: number, y: number, rx: number, ry: number): boolean {
		for (let i = 0; i < 8; i += 1) {
			const angle = (i / 8) * Math.PI * 2
			if (!this.isWater(x + Math.cos(angle) * rx, y + Math.sin(angle) * ry)) {
				return false
			}
		}
		return this.isWater(x, y)
	}

	/** Draw one frame of surface motion. */
	draw(g: Graphics, time: number): void {
		// Broad sky light on the swell, under everything else.
		for (const sheen of this.sheens) {
			const x = wrap(sheen.x + time * sheen.speed)
			if (!this.insideWater(x, sheen.y, sheen.rx, sheen.ry)) continue
			const pulse = (Math.sin(time * 0.5 + sheen.phase) + 1) / 2
			g.ellipse(x, sheen.y, sheen.rx, sheen.ry).fill({
				color: this.palette.snowLight,
				alpha: sheen.alpha * (0.45 + pulse * 0.75)
			})
		}

		// Crests carried by the current. Every dash is its own little wave: a lit
		// lip, a dark trough under it and, on the brightest ones, a foam pixel.
		for (const chop of this.chops) {
			const x = wrap(chop.x + time * chop.speed)
			const sx = x + Math.sin(time * 0.7 + chop.phase) * 0.6
			const sy = chop.y + Math.sin(time * 0.9 + chop.phase * 1.7) * 0.6
			if (!this.isWater(sx, sy)) continue
			if (!this.isWater(sx + chop.length, sy)) continue

			const breathe = (Math.sin(time * 1.6 + chop.phase) + 1) / 2
			const alpha = chop.alpha * (0.4 + breathe * 0.9)
			g.moveTo(sx, sy)
			g.quadraticCurveTo(sx + chop.length * 0.5, sy - chop.lift, sx + chop.length, sy + 0.3)
			g.stroke({ width: 1, color: chop.color, alpha })

			// The shade beneath a crest is what makes it stand up off the ramp.
			g.moveTo(sx + 1, sy + 1.2)
			g.lineTo(sx + chop.length * 0.62, sy + 1.2 + chop.lift * 0.25)
			g.stroke({ width: 1, color: this.trough, alpha: alpha * 0.5 })

			if (breathe > 0.92 && chop.length > 9) {
				g.rect(sx + chop.length * 0.58, sy - 1.5, 1, 1).fill({
					color: this.palette.snowLight,
					alpha: alpha * 1.4
				})
			}
		}

		// Ripple rings that open and fade, so the surface reads as water rather
		// than as a field of dashes.
		for (const pop of this.pops) {
			const t = (time / pop.period + pop.phase) % 1
			const radius = 1 + t * pop.radius
			// The ring grows until it reaches the bank and then stops drawing: a
			// ring that kept opening would have to be clipped anyway.
			if (!this.insideWater(pop.x, pop.y, radius, radius * 0.36)) continue
			g.ellipse(pop.x, pop.y, radius, radius * 0.36).stroke({
				width: 1,
				color: this.palette.snow,
				alpha: 0.2 * (1 - t)
			})
			if (t < 0.5) {
				g.ellipse(pop.x, pop.y, 1 + t * pop.radius * 0.45, 0.6).fill({
					color: this.palette.snowLight,
					alpha: 0.25 * (1 - t * 2)
				})
			}
		}
	}
}
