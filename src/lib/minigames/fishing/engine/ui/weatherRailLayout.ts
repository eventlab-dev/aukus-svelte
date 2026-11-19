import type { ForecastStep } from '../world'

/**
 * Pixel geometry of the weather rail, in virtual units.
 *
 * The rail is a slim panel holding a fixed number of card slots. Half the
 * height of the corner travel cards on purpose: it is a readout, not a picture.
 * A card is two lines — the clock (or «СЕЙЧАС» for the period in progress) over
 * the name of the sky, with the weather glyph beside them — and the row is
 * always {@link RAIL_SLOTS} cards wide, one card per upcoming front, so the
 * panel never changes size and never repeats the same sky in place of the
 * fronts behind it.
 */
export const RAIL = {
	cardWidth: 42,
	cardHeight: 16,
	/**
	 * Space between two period cards. It must not read wider than the panel's own
	 * frame (two 1 px bands), or the row of cards looks like it floats in a gutter
	 * instead of sitting in a plate.
	 */
	gap: 2,
	/** Panel padding between the frame and the cards. */
	pad: 2,
	/** Air between the glyph and its captions. */
	labelGap: 3,
	/** Glyph footprint. */
	icon: 12
} as const

/** Panel height: the cards plus the panel's own padding. */
export const RAIL_HEIGHT = RAIL.pad * 2 + RAIL.cardHeight

/** How many cards the rail always shows: one per forecast step. */
export const RAIL_SLOTS = 4

/** Panel width that holds `count` equal cards, padding and gaps included. */
export function railWidth(count: number): number {
	return RAIL.pad * 2 + count * RAIL.cardWidth + Math.max(0, count - 1) * RAIL.gap
}

/** The first `count` fronts of the forecast: exactly what the rail draws. */
export function railSteps(steps: readonly ForecastStep[], count = RAIL_SLOTS): ForecastStep[] {
	return steps.slice(0, count)
}
