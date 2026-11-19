import type { Graphics } from 'pixi.js'
import { VIEW } from '../../config'
import type { WaterLook } from './waterLook'
import type { FoamSpeck } from './waterMask'

const TAU = Math.PI * 2

/**
 * Foam is drawn in a handful of fixed opacities instead of a per-speck alpha.
 *
 * Every speck has its own pulse, so a per-speck alpha would mean a separate
 * fill for each of them every frame. Quantising the pulse lets all the specks
 * of one strength go into one path: four fills for the whole shoreline, and the
 * stepping reads as pixel animation rather than as a compromise.
 */
const FOAM_LEVELS = 4

/**
 * Specks are cut off below this share of the pulse, so the edge is always
 * broken into separate pixels instead of glowing as an even line.
 */
const FOAM_BREAK = 0.4

/** Strength a glint has to pass to catch its second pixel: a lens, not a dot. */
const GLINT_SPREAD = 0.72

/** A rare sparkle that twinkles on its own schedule. */
export interface Glint {
	x: number
	y: number
	phase: number
	period: number
}

/** Deterministic 0..1 hash, so a glint lands in the same place every reload. */
function hash(a: number, b: number): number {
	const value = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453
	return value - Math.floor(value)
}

/**
 * Scatters the rare glints over open water. They are placed once and twinkle
 * where they are: a glint is the net catching the sun, and the net moves under
 * it, not the other way round.
 */
export function readGlints(look: WaterLook, isShore: (x: number, y: number) => boolean): Glint[] {
	const { glintCount, glintMinPeriod, glintMaxPeriod } = look
	const spots: Glint[] = []
	for (let i = 0; i < glintCount; i += 1) {
		// A few tries each: a glint that lands on the bank is dropped rather than
		// moved onto the nearest water, which would pile them up along the shore.
		for (let attempt = 0; attempt < 6; attempt += 1) {
			const x = 3 + Math.floor(hash(i + 11, attempt) * (VIEW.width - 6))
			const y = 3 + Math.floor(hash(attempt + 7, i + 3) * (VIEW.height - 6))
			if (isShore(x + 0.5, y + 0.5)) continue
			spots.push({
				x,
				y,
				phase: hash(i, attempt + 1),
				period: glintMinPeriod + hash(attempt, i + 5) * (glintMaxPeriod - glintMinPeriod)
			})
			break
		}
	}
	return spots
}

/** One frame of sun glints: each flashes on its own schedule. */
export function paintGlints(
	g: Graphics,
	spots: readonly Glint[],
	look: WaterLook,
	time: number
): void {
	g.clear()
	const { glint } = look
	for (const spot of spots) {
		const pulse = (Math.sin((time / spot.period) * TAU + spot.phase * TAU) + 1) / 2
		if (pulse < 0.6) continue
		const strength = (pulse - 0.6) / 0.4
		g.rect(spot.x, spot.y, 1, 1).fill({ color: glint, alpha: strength })
		if (strength > GLINT_SPREAD) {
			// Only the peak catches the second pixel, so a glint flashes instead of
			// sitting there as a two-pixel dash.
			g.rect(spot.x + 1, spot.y, 1, 1).fill({
				color: glint,
				alpha: (strength - GLINT_SPREAD) / (1 - GLINT_SPREAD)
			})
		}
	}
}

/**
 * One frame of foam. `levels` is reused as scratch, one byte per speck, so the
 * per-frame loop allocates nothing.
 */
export function paintFoam(
	g: Graphics,
	specks: readonly FoamSpeck[],
	levels: Uint8Array,
	look: WaterLook,
	time: number
): void {
	g.clear()
	let highest = 0
	for (let i = 0; i < specks.length; i += 1) {
		const speck = specks[i]
		const cycle = (time / speck.period + speck.phase) % 1
		// A speck climbs and breaks rather than glowing evenly: the sine gives it
		// one rise per cycle, and everything below the break threshold is the lull
		// where the shore is bare.
		const pulse = Math.sin(Math.PI * cycle)
		const level =
			pulse < FOAM_BREAK
				? 0
				: 1 +
					Math.min(
						FOAM_LEVELS - 1,
						Math.floor(((pulse - FOAM_BREAK) / (1 - FOAM_BREAK)) * FOAM_LEVELS)
					)
		levels[i] = level
		if (level > highest) highest = level
	}

	for (let level = 1; level <= highest; level += 1) {
		const strength = level / FOAM_LEVELS
		// Shadow first: the water behind a crest of foam has to darken before the
		// foam lands on it, or the speck floats on the surface without a trough.
		for (let i = 0; i < specks.length; i += 1) {
			const speck = specks[i]
			if (levels[i] !== level || speck.shadeX < 0) continue
			g.rect(speck.shadeX, speck.shadeY, 1, 1)
		}
		g.fill({
			color: look.foamShade,
			alpha: look.foamAlpha * strength * 0.45
		})
		for (let i = 0; i < specks.length; i += 1) {
			const speck = specks[i]
			if (levels[i] !== level) continue
			const spread = strength > 0.7 && speck.tailX >= 0
			g.rect(speck.x, speck.y, spread ? 2 : 1, 1)
		}
		g.fill({ color: look.foam, alpha: look.foamAlpha * strength })
	}
}
