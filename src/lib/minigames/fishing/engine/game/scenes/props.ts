import { Container, Graphics } from 'pixi.js'
import type { AreaPalette } from '../../areas'
import { ditherNoise } from './dither'

/**
 * Small pieces of the bank that every scene needs: the drift a tree stands in,
 * the contact shadow a bare prop leaves, the stones lying on the snow and the
 * reeds on the shore.
 *
 * The stone used to be a recoloured asset-pack sprite; its pointed facets read
 * as a bomb with spikes. It is drawn the way the rest of the scenery is lit — a
 * faceted silhouette with a lit face, a shaded side and a snow cap — so it reads
 * at a glance. Reeds and stones keep their own dark contact mark; trees, bushes
 * and boulders stand in a drift instead, because a pile of snow under a trunk
 * says "snow" where a dark oval says "shadow of something that is not there".
 */

/** Deterministic 0..1 noise, so previews match the live scene. */
function noise(a: number, b: number): number {
	return (ditherNoise(a, b) + 1) / 2
}

/** Ink blue the props shade the snow with; the angler uses it too. */
const CONTACT = 0x0a1c2a
/**
 * Transparent row every sprite sheet keeps under a trunk or a bush, in texture
 * pixels. A sprite anchored at its base therefore ends one scaled row above the
 * pixels that touch the ground, so callers pass the visible foot, not the
 * anchor.
 */
export const SPRITE_PAD = 1

/**
 * A snowdrift, ~26 × 7 px at `scale` 1, sitting on `(x, y)`.
 *
 * The outline is a wavy half-ellipse rather than a clean oval: a drift is
 * something the wind piled up, and the bumps are what separate it from the
 * shadow it would otherwise be mistaken for. It is what the trees, bushes and
 * stones stand in — the contact shadow below is only used where a prop has no
 * mound of its own.
 */
export function drawSnowDrift(
	props: Container,
	x: number,
	y: number,
	scale: number,
	palette: AreaPalette
): void {
	const g = new Graphics()
	const w = 13 * scale
	const h = 4.2 * scale
	const seed = Math.round(x * 7 + y * 3)

	const top: number[] = []
	const steps = 14
	for (let i = 0; i <= steps; i += 1) {
		const t = i / steps
		const angle = Math.PI + t * Math.PI
		// Two overlapping ripples keep the crest from looking extruded.
		const bump = 1 + Math.sin(t * Math.PI * 3.1 + 0.6) * 0.14 + (noise(i + 1, seed) - 0.5) * 0.16
		top.push(x + Math.cos(angle) * w, y - Math.sin(angle) * h * bump)
	}
	top.push(x + w, y + 0.6, x - w, y + 0.6)
	g.poly(top).fill({ color: palette.snow, alpha: 0.96 })

	// Shade along the foot of the drift, where it meets the ground.
	g.ellipse(x, y - 0.6, w * 0.92, h * 0.32).fill({
		color: palette.snowShade,
		alpha: 0.42
	})
	// Lit crest on the windward side.
	g.ellipse(x - w * 0.24, y - h * 0.72, w * 0.4, h * 0.26).fill({
		color: palette.snowLight,
		alpha: 0.9
	})
	// A couple of crystals, so the drift catches the eye as snow.
	for (let i = 0; i < 2; i += 1) {
		const px = x + (noise(i + 9, seed) - 0.5) * w * 1.2
		const py = y - h * (0.4 + noise(i + 4, seed) * 0.5)
		g.rect(Math.round(px), Math.round(py), 1, 1).fill({
			color: palette.snowLight,
			alpha: 0.95
		})
	}
	g.zIndex = y - 0.2
	props.addChild(g)
}

/**
 * The one contact shadow every prop in every scene uses.
 *
 * The angler's shadow is the reference: an ink-blue core inside a softer rim,
 * both centred on the row where the prop touches the snow. Every tree, bush,
 * stone, clump of grass, reed, signpost, lantern and log borrows this same
 * recipe, so nothing on the bank looks pasted on while the angler looks
 * anchored — a pale snow collar under one prop and a dark oval under the next
 * was exactly what made them read as unrelated objects.
 *
 * `foot` is the row that visibly touches the ground. `halfWidth` is the half of
 * the footprint — the trunk or the post, never the canopy — and the ellipse is
 * centred on it, so the prop stands in the middle of its own shadow.
 */
export function paintContactShadow(g: Graphics, x: number, foot: number, halfWidth: number): void {
	const reach = Math.max(3, halfWidth)
	g.ellipse(x, foot, reach, Math.max(1.2, reach * 0.33)).fill({
		color: CONTACT,
		alpha: 0.32
	})
	g.ellipse(x, foot, reach * 0.52, Math.max(1, reach * 0.17)).fill({
		color: CONTACT,
		alpha: 0.35
	})
}

/** {@link paintContactShadow} as its own z-sorted node, under the sprite. */
export function drawContactShadow(
	props: Container,
	x: number,
	foot: number,
	halfWidth: number
): void {
	const g = new Graphics()
	paintContactShadow(g, x, foot, halfWidth)
	g.zIndex = foot - 0.1
	props.addChild(g)
}

/**
 * A clump of last year's reeds, ~20 px tall and ~18 px wide at `scale` 1.
 *
 * The river drew its own reeds inline; the lake needed the same plant on its
 * shore, so the drawing lives here and both waters use it. Winter reeds: dry
 * leaning stalks, a dark cattail head on the taller ones, snow caught on the
 * heads and the shade the clump leaves on the snow it stands in.
 */
export function drawReedClump(
	props: Container,
	x: number,
	y: number,
	palette: AreaPalette,
	scale = 1,
	seed = 0
): void {
	const g = new Graphics()
	const base = Math.round(x * 3 + y + seed * 17)
	const count = 6 + Math.round(noise(seed + 1, 3) * 4)

	// The clump's own shadow, first: the stalks then stand in the middle of it
	// instead of floating above it.
	paintContactShadow(g, x, y, 6 * scale)

	for (let i = 0; i < count; i += 1) {
		// Stalks fan out from the clump's foot, so a group reads as one plant.
		const spread = count > 1 ? (i / (count - 1) - 0.5) * 2 : 0
		const bx = x + spread * 6 * scale + (noise(i + 2, base) - 0.5) * 3
		const height = (11 + noise(i + 5, base) * 9) * scale
		const lean = (spread * 5 + (noise(i + 8, base) - 0.5) * 3) * scale
		const tipX = bx + lean
		const tipY = y - height
		g.moveTo(bx, y)
			.lineTo(tipX, tipY)
			.stroke({
				width: 1,
				color: i % 3 === 0 ? 0x8f7a58 : 0x6b5b41,
				alpha: 0.88
			})

		if (noise(i + 11, base) > 0.5) {
			// Cattail: a dark head under the tip, with a line of snow on top of it.
			g.rect(tipX - 1, tipY + 1, 3, 4).fill({ color: 0x4a3826, alpha: 0.95 })
			g.rect(tipX - 1, tipY + 2, 1, 2).fill({ color: 0x6f5637, alpha: 0.9 })
			g.rect(tipX - 1, tipY, 3, 1).fill({
				color: palette.snowLight,
				alpha: 0.85
			})
		} else {
			// A spent seed plume: one dry pixel above the stalk.
			g.rect(tipX, tipY - 1, 1, 2).fill({ color: 0x8f7a58, alpha: 0.75 })
		}
	}

	// A last crust of snow caught at the foot of the stalks — a couple of pale
	// pixels, not a patch: a wide pale ellipse here covered the clump's own
	// shadow and left the grass standing above a puddle again.
	g.rect(Math.round(x - 3 * scale), Math.round(y), 2, 1).fill({
		color: palette.snow,
		alpha: 0.6
	})
	g.rect(Math.round(x + 2 * scale), Math.round(y), 1, 1).fill({
		color: palette.snowLight,
		alpha: 0.7
	})
	g.zIndex = y
	props.addChild(g)
}

/**
 * A shore stone, ~16 px wide at `scale` 1, sitting on `(x, y)`.
 *
 * Faceted: an irregular silhouette with a lit upper-left face, a dark right
 * side, a dark waterline where it meets the ground and a snow cap on top, which
 * is also what keeps it from reading as a spiky ball.
 */
export function drawShoreStone(
	props: Container,
	x: number,
	y: number,
	scale: number,
	palette: AreaPalette
): void {
	const g = new Graphics()
	const w = 8 * scale
	const h = 7 * scale
	const seed = Math.round(x * 13 + y * 5)
	const at = (u: number, v: number): [number, number] => [
		x + u * w + (noise(u + 2, seed) - 0.5) * 1.2,
		y - v * h + (noise(v + 7, seed) - 0.5) * 1.2
	]

	// The stone's own footprint in the shared shadow recipe: a rock that stands
	// on a paler mark than the angler looked pasted onto the snow.
	paintContactShadow(g, x, y + 0.4, w * 0.95)

	const body = [
		...at(-1, 0.12),
		...at(-0.82, 0.62),
		...at(-0.3, 0.98),
		...at(0.32, 0.9),
		...at(0.88, 0.5),
		...at(0.98, 0.06),
		...at(0.62, -0.08),
		...at(-0.5, -0.06)
	]
	g.poly(body).fill(0x66707c)

	// Lit face, top-left.
	g.poly([...at(-0.86, 0.56), ...at(-0.34, 0.9), ...at(-0.1, 0.42), ...at(-0.55, 0.16)]).fill(
		0x8b97a4
	)
	// Shaded right side.
	g.poly([...at(0.3, 0.86), ...at(0.86, 0.46), ...at(0.62, 0.14), ...at(0.18, 0.5)]).fill(0x4a525c)

	// Snow cap on the crown.
	g.poly([...at(-0.62, 0.74), ...at(-0.16, 0.96), ...at(0.34, 0.78), ...at(0.02, 0.66)]).fill({
		color: palette.snow,
		alpha: 0.92
	})

	g.poly(body).stroke({ width: 1, color: 0x2b323a, alpha: 0.85 })
	g.zIndex = y
	props.addChild(g)
}
