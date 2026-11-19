import type { AreaPalette } from '../../areas'
import type { WaterKind } from '../../types'
import { mixColor } from '../../world'

/** Drift of one drifting pattern across the surface, in world pixels/second. */
export interface SurfaceDrift {
	x: number
	y: number
}

/**
 * Every knob of the textured water, flat on purpose: one table per water body
 * spreads over the shared base, so an area only states what it does
 * differently and a missing field can never leave a hole in the look.
 *
 * The colours are not in here: they are derived from the area palette in
 * {@link waterLookFor}, so a repaint of the depth ramp carries the caustics
 * with it instead of leaving them on last season's blue.
 */
export interface WaterTuning {
	/** Side of one baked caustic tile, in texels. */
	tile: number
	/** The broad, slow net: world pixels per texel, its drift and its opacity. */
	farScale: number
	farDrift: SurfaceDrift
	farAlpha: number
	/** The fine, quick net, laid over the broad one. */
	nearScale: number
	nearDrift: SurfaceDrift
	nearAlpha: number
	/**
	 * Rock of each net around the spot it sits on, in world pixels. A body with a
	 * current drifts and does not sway; a still body does the opposite, so its
	 * surface breathes without travelling anywhere.
	 */
	farSway: SurfaceDrift
	nearSway: SurfaceDrift
	/** Seconds of one sway, so all three sheets share a slow rhythm. */
	swayPeriod: number
	/** Sparse glitter sheet: a third, faster drift of single bright texels. */
	glitterScale: number
	glitterDrift: SurfaceDrift
	glitterSway: SurfaceDrift
	glitterAlpha: number
	/** Seconds of the sheet's slow breath, so it shimmers instead of blinking. */
	glitterPeriod: number
	/** Rare sun glints that twinkle on their own schedule. */
	glintCount: number
	glintMinPeriod: number
	glintMaxPeriod: number
	/** Share of the shoreline that carries a foam speck, and how bright it is. */
	foamShare: number
	foamAlpha: number
	/**
	 * How far inside the water the foam line sits, in pixels. The ice shelf is
	 * painted over the first few water pixels, so foam on the boundary itself
	 * would be white on white; a couple of pixels out it sits on open water.
	 */
	foamInset: number
	/** Seconds for one speck to rise and break. */
	foamMinPeriod: number
	foamMaxPeriod: number
	/**
	 * Broad, low-frequency light that lifts whole patches of the surface at once.
	 * One tile is larger than the frame, so this pass never shows a repeat; `0`
	 * switches it off, which is what the waters with a current want.
	 */
	breathScale: number
	breathAlpha: number
	/** Seconds of one breath: the patches brighten, dim and drift. */
	breathPeriod: number
	breathSway: SurfaceDrift
}

/** The resolved look: the tuning plus the palette-derived colours. */
export interface WaterLook extends WaterTuning {
	/** Highlight of the fine net: the shallow end of the depth ramp, lifted. */
	shallow: number
	/** Highlight of the broad net: the deep end, lifted out of its hole. */
	deep: number
	glint: number
	foam: number
	/** Shadow under a foam speck, mixed between ice and deep water. */
	foamShade: number
	/** Colour of the broad breathing light, paler than either net. */
	breath: number
}

/**
 * Shared defaults: a body of water that is neither still nor breaking.
 *
 * The net scales are whole numbers because a caustic texel must land on whole
 * screen pixels — at 1.5× every other texel would straddle the grid and the
 * water grain would look like it came from a different resolution than the
 * snow.
 */
const BASE: WaterTuning = {
	tile: 64,
	farScale: 2,
	farDrift: { x: 4.2, y: 0.9 },
	farAlpha: 0.16,
	nearScale: 1,
	nearDrift: { x: 7.4, y: -1.6 },
	nearAlpha: 0.13,
	farSway: { x: 0, y: 0 },
	nearSway: { x: 0, y: 0 },
	swayPeriod: 13,
	glitterScale: 1,
	glitterDrift: { x: 9.5, y: 2.4 },
	glitterSway: { x: 0, y: 0 },
	glitterAlpha: 0.5,
	glitterPeriod: 8.5,
	glintCount: 44,
	glintMinPeriod: 1.4,
	glintMaxPeriod: 3.6,
	foamShare: 0.4,
	foamAlpha: 0.85,
	foamInset: 2,
	foamMinPeriod: 2.2,
	foamMaxPeriod: 4.4,
	// Off by default: a moving body of water is carried by its drift. The lake
	// turns it on, because still water has to breathe instead.
	breathScale: 5,
	breathAlpha: 0,
	breathPeriod: 21,
	breathSway: { x: 0, y: 0 }
}

/**
 * Per-water overrides. The bay chops (large, quick, bright nets and the most
 * foam), the lake has no current at all (both nets rock in place instead of
 * travelling, and only the light on them moves), and the river runs downstream
 * to the left (both nets travel that way, the fine one much faster, so the
 * surface shears with the current instead of sliding as a sheet).
 */
const TUNING: Record<WaterKind, Partial<WaterTuning>> = {
	sea: {
		farDrift: { x: 5.6, y: 1.7 },
		farAlpha: 0.17,
		nearDrift: { x: 9.4, y: -2.5 },
		nearAlpha: 0.14,
		glitterDrift: { x: 12.5, y: 3.1 },
		glitterAlpha: 0.34,
		glintCount: 40,
		foamShare: 0.45,
		foamAlpha: 0.95,
		// The bay's ice shelf is nine pixels wide, so the foam has to stand clear
		// of it to be seen at all.
		foamInset: 5,
		foamMinPeriod: 1.8,
		foamMaxPeriod: 3.6
	},
	lake: {
		// Still water: nothing travels, the nets only rock where they lie. The
		// rock has to be quick enough that its whole-pixel steps read as motion —
		// a slow one snaps a pixel every second or so and looks like a flip-book,
		// and the broad net steps in two-pixel jumps, so it needs the most speed.
		farScale: 2,
		farDrift: { x: 0, y: 0 },
		farSway: { x: 4, y: 1.2 },
		farAlpha: 0.13,
		nearDrift: { x: 0, y: 0 },
		nearSway: { x: 3, y: -0.9 },
		nearAlpha: 0.1,
		swayPeriod: 2.8,
		glitterDrift: { x: 0, y: 0 },
		glitterSway: { x: 3.4, y: 1.1 },
		glitterAlpha: 0.24,
		glitterPeriod: 11,
		glintCount: 20,
		foamShare: 0.22,
		foamAlpha: 0.72,
		foamInset: 3,
		foamMinPeriod: 3.2,
		foamMaxPeriod: 6.2,
		// The broad pass: a 256-texel tile at scale 2 covers more than the whole
		// frame, so the patches are lake-sized and the tile never shows a seam.
		breathScale: 2,
		breathAlpha: 0.09,
		breathPeriod: 21,
		breathSway: { x: 3.6, y: 1.3 }
	},
	river: {
		// Downstream is to the left: the reach drops away that way.
		farDrift: { x: -10.5, y: 0.3 },
		farAlpha: 0.15,
		nearDrift: { x: -17, y: 1.2 },
		nearAlpha: 0.12,
		glitterDrift: { x: -21, y: 1.4 },
		glitterAlpha: 0.3,
		glintCount: 28,
		foamShare: 0.28,
		foamAlpha: 0.9,
		foamInset: 3,
		foamMinPeriod: 1.6,
		foamMaxPeriod: 3.4
	}
}

/**
 * The look of one water body: shared knobs, the body's own overrides, then the
 * colours the depth ramp already uses.
 *
 * The net colours are scaled up in brightness instead of mixed toward white:
 * mixing a near-black deep end with snow light passes through grey, and grey
 * veins over blue water read as dirt rather than as light. Scaling the channels
 * keeps the hue, so the lake's net stays blue and the bay's stays turquoise.
 */
export function waterLookFor(kind: WaterKind, palette: AreaPalette): WaterLook {
	const stops = palette.waterStops
	const shallow = stops[0].color
	const deep = stops[stops.length - 1].color
	// A little white in the core so the ridge reads as a highlight, not as a
	// pastel band.
	const netShallow = mixColor(brightened(shallow, 205), palette.snowLight, 0.2)
	return {
		...BASE,
		...TUNING[kind],
		shallow: netShallow,
		deep: mixColor(brightened(deep, 118), palette.snowLight, 0.12),
		glint: mixColor(palette.snowLight, 0xffffff, 0.65),
		foam: palette.snowLight,
		foamShade: mixColor(palette.iceDeep, palette.waterFar, 0.4),
		// The broad pass is light, not another net: it sits between the two nets in
		// tone so it lifts the water without drawing anything of its own.
		breath: mixColor(netShallow, palette.ice, 0.45)
	}
}

/** Scale a colour until its brightest channel reaches `target`, hue intact. */
function brightened(color: number, target: number): number {
	const r = (color >> 16) & 0xff
	const g = (color >> 8) & 0xff
	const b = color & 0xff
	const factor = target / Math.max(1, Math.max(r, g, b))
	const scale = (channel: number): number => Math.min(255, Math.round(channel * factor))
	return (scale(r) << 16) | (scale(g) << 8) | scale(b)
}
