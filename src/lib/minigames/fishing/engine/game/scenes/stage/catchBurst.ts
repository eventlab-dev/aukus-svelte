import type { Graphics } from 'pixi.js'
import type { FishTier } from '../../../types'

/**
 * The light behind a landed fish, per rarity.
 *
 * The burst used to be one shape recoloured three ways, so a trophy and a roach
 * came up under the same star. Rarity is the one thing the round keeps telling
 * the player — through the ring, the codex and the weight — and the payoff shot
 * should say it too, so each tier gets its own light: a common catch is a small
 * cream star, an uncommon one a mint star with a few spears, a rare one a denser
 * ice star with a crown of fine spears, a mythic one a big gold burst with a
 * deeper glow and a second ring of light.
 *
 * Everything here is baked once per tier and then only spun and faded by
 * {@link CatchLayer}, so the extra shapes cost nothing per frame.
 */

/** Radius where a wedge leaves the centre: all wedges start on a pinhead. */
const INNER = 1
/**
 * Half-width of a wedge at the centre and at its rim. Wedges are narrow in the
 * middle and wide at the edge: a star of needles reads as texture, a star of
 * wedges reads as light.
 */
const WEDGE_TIP = 0.3
/** Fine spears are thinner than the wedges that carry the star. */
const SPEAR_TIP = 0.15
const SPEAR_EDGE = 0.45
/**
 * How strong each band of a wedge is, from the centre outwards.
 *
 * A wedge used to end on one hard step, which made the burst read as a cut-out
 * star rather than as light: the blunt ends of the long rays were the first
 * thing the eye caught. The bands dim on the way out instead, in flat fills
 * rather than a smooth ramp — a gradient would be the one blurred thing on this
 * screen — and the fade is held back to the last third, so the body keeps its
 * strength and only the ends dissolve.
 */
const TIP_FADE = [1, 1, 1, 0.8, 0.45, 0.15] as const

interface RayLook {
	/** Colours: the alternating wedges, the fine spears, the core glow. */
	long: number
	short: number
	spear: number
	core: number
	/** Overall strength: a common catch glows, a trophy blazes. */
	intensity: number
	/** Wedges in the main star: a rarer catch gets a finer, denser star. */
	beams: number
	/** Reach and rim width of the two alternating wedges, in scene pixels. */
	longReach: number
	shortReach: number
	longEdge: number
	shortEdge: number
	/** Thin spears shot between the wedges; a common catch has none. */
	spears: number
	spearReach: number
	/** Faint discs that fill the burst with light before the wedges go on. */
	glow: readonly (readonly [radius: number, alpha: number])[]
	/** Hard discs in the middle, where every wedge meets. */
	discs: readonly (readonly [radius: number, alpha: number])[]
	/** Multiplier on the idle turn: a rarer catch turns a little livelier. */
	spin: number
}

/**
 * Common keeps the warm cream of the reference effect, uncommon turns it mint,
 * rare ice and mythic gold — the same colours the codex uses for the tiers.
 * What grows with the tier is the shape, not only the hue: beams, reach, a crown
 * of spears, a wash under the star and a deeper core.
 */
const RAY_LOOK: Record<FishTier, RayLook> = {
	common: {
		long: 0xfff3d8,
		short: 0xefcf9f,
		spear: 0xfff8ea,
		core: 0xfff8ea,
		intensity: 0.62,
		beams: 24,
		longReach: 21,
		shortReach: 13,
		longEdge: 1.3,
		shortEdge: 0.9,
		spears: 0,
		spearReach: 0,
		glow: [],
		discs: [
			[8, 0.16],
			[5, 0.24],
			[2.5, 0.36]
		],
		spin: 1
	},
	uncommon: {
		long: 0xe6fff0,
		short: 0x8fe0b8,
		spear: 0xd8fff0,
		core: 0xf6fffa,
		intensity: 0.73,
		beams: 28,
		longReach: 22,
		shortReach: 13.8,
		longEdge: 1.35,
		shortEdge: 0.95,
		spears: 4,
		spearReach: 23.5,
		glow: [],
		discs: [
			[9, 0.12],
			[6, 0.2],
			[3, 0.32]
		],
		spin: 1.12
	},
	rare: {
		long: 0xe4f4ff,
		short: 0x8fc8ee,
		spear: 0xbfe4ff,
		core: 0xf2fbff,
		intensity: 0.84,
		beams: 32,
		longReach: 23.5,
		shortReach: 14.5,
		longEdge: 1.4,
		shortEdge: 1,
		spears: 8,
		spearReach: 26,
		glow: [[22, 0.04]],
		discs: [
			[10, 0.08],
			[7.5, 0.15],
			[5, 0.24],
			[2.5, 0.36]
		],
		spin: 1.25
	},
	mythic: {
		long: 0xfff1bd,
		short: 0xffc45c,
		spear: 0xffe9a8,
		core: 0xfff8d8,
		intensity: 0.96,
		beams: 40,
		longReach: 26,
		shortReach: 16.5,
		longEdge: 1.5,
		shortEdge: 1.1,
		spears: 12,
		spearReach: 29,
		glow: [[24, 0.035]],
		discs: [
			[11, 0.06],
			[8, 0.1],
			[5.5, 0.16],
			[3.5, 0.24],
			[2, 0.34]
		],
		spin: 1.5
	}
}

/**
 * How far a tier's light reaches from the centre of the fish, rim included.
 *
 * The catch is laid out from this: the name tag hangs above it and the fish
 * floats high enough for its bottom to clear the angler. A mythic burst is
 * half again as wide as a common one, so both of those gaps have to be measured
 * against the tier that is actually being shown.
 */
export function burstReach(tier: FishTier): number {
	const look = RAY_LOOK[tier]
	const glowReach = look.glow.reduce((far, [radius]) => Math.max(far, radius), 0)
	return Math.max(look.longReach + look.longEdge, look.spearReach + SPEAR_EDGE, glowReach)
}

/** Idle turn of the burst, as a multiple of the base spin. */
export function burstSpin(tier: FishTier): number {
	return RAY_LOOK[tier].spin
}

/** Bakes one rarity's burst, centred on the origin of `g`. */
export function paintBurst(g: Graphics, tier: FishTier): void {
	const look = RAY_LOOK[tier]
	g.clear()
	// A flat wash of light under the wedges: it deepens the middle of the star
	// without the blur that a radial gradient would cost.
	for (const [radius, alpha] of look.glow) {
		g.circle(0, 0, radius).fill({
			color: look.core,
			alpha: alpha * look.intensity
		})
	}
	for (let i = 0; i < look.beams; i += 1) {
		const long = i % 2 === 0
		paintWedge(g, {
			angle: (i / look.beams) * Math.PI * 2,
			reach: long ? look.longReach : look.shortReach,
			tip: WEDGE_TIP,
			edge: long ? look.longEdge : look.shortEdge,
			color: long ? look.long : look.short,
			strength: (long ? 0.55 : 0.34) * look.intensity
		})
	}
	// The crown of fine spears sits between the wedges and reaches past them, so
	// the rarer bursts have a second layer of light instead of one flat star.
	for (let i = 0; i < look.spears; i += 1) {
		paintWedge(g, {
			angle: ((i + 0.5) / look.spears) * Math.PI * 2,
			reach: look.spearReach,
			tip: SPEAR_TIP,
			edge: SPEAR_EDGE,
			color: look.spear,
			strength: 0.42 * look.intensity
		})
	}
	// The glow in the middle, where every wedge meets.
	for (const [radius, alpha] of look.discs) {
		g.circle(0, 0, radius).fill({
			color: look.core,
			alpha: alpha * look.intensity
		})
	}
}

interface Wedge {
	/** Direction of the wedge, in radians. */
	angle: number
	/** Distance from the centre to the rim of the wedge. */
	reach: number
	/** Half-width where it leaves the centre and at the rim. */
	tip: number
	edge: number
	color: number
	/** Alpha of the innermost band; the ones towards the tip are dimmer. */
	strength: number
}

/** One wedge, cut into bands that dim towards its tip. */
function paintWedge(g: Graphics, wedge: Wedge): void {
	const { angle, reach, tip, edge, color, strength } = wedge
	const cos = Math.cos(angle)
	const sin = Math.sin(angle)
	const px = -sin
	const py = cos
	const bands = TIP_FADE.length
	for (let band = 0; band < bands; band += 1) {
		const from = band / bands
		const to = (band + 1) / bands
		const near = INNER + (reach - INNER) * from
		const far = INNER + (reach - INNER) * to
		const nearHalf = tip + (edge - tip) * from
		const farHalf = tip + (edge - tip) * to
		g.poly([
			cos * near + px * nearHalf,
			sin * near + py * nearHalf,
			cos * far + px * farHalf,
			sin * far + py * farHalf,
			cos * far - px * farHalf,
			sin * far - py * farHalf,
			cos * near - px * nearHalf,
			sin * near - py * nearHalf
		]).fill({ color, alpha: strength * TIP_FADE[band] })
	}
}
