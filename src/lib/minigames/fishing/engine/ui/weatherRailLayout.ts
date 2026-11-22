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
 *
 * On its left end the panel carries one caption — «ПОГОДА» — in a block of its
 * own, so the widget names itself instead of asking the player to infer what a
 * row of times and sky names is ({@link RAIL_LABEL}). The block is spaced by air
 * alone: a hairline used to close it, but next to the sunken wells it read as a
 * third, competing edge on a 20 px strip.
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

/**
 * The caption block on the panel's left end: the air before the letters.
 *
 * `pad` is the plate's own inset before the caption's ink. The air *after* the
 * caption is the left chevron's own indent (`RAIL_ARROW_AIR.label`): the arrow
 * belongs to that side of the plate, so its spacing is measured from the words
 * instead of leaving the caption to push it around.
 *
 * The caption lives *inside* the plate instead of above it on purpose: the
 * panel's height is its whole footprint, and `castSafety` measures the safe
 * cast line from {@link RAIL_HEIGHT}. A caption stacked on top would push the
 * fight ring further up the water; sideways, the row simply gives up a strip of
 * empty plate that the cards never used.
 */
export const RAIL_LABEL = { pad: 6 } as const

/** How many cards the rail always shows: one per forecast step. */
export const RAIL_SLOTS = 4

/**
 * Fronts the widget asks the clock for: the scrolling horizon.
 *
 * A dozen fronts at eight to twelve minutes each is about two hours of sky,
 * deeper than a session. The player sees {@link RAIL_SLOTS} at a time and
 * scrolls the rest with the chevrons or by dragging the strip.
 */
export const RAIL_HORIZON = 12

/**
 * Chevron at the two ends of the strip.
 *
 * `width` is the ink itself: the glyph is four columns of 1 px, and the box must
 * be the same four, otherwise the drawing sits at the left of a wider box and
 * the two arrows end up with different air on the same side (7 px to the cards
 * on the left, 11 px to the plate edge on the right). `hit` is the invisible
 * press box, wider than the ink so a thumb can find it on a 20 px strip.
 */
export const RAIL_ARROW = { width: 4, hit: 12 } as const

/**
 * Air around a chevron, in virtual pixels.
 *
 * `outer` is the same on both ends — the indent between «ПОГОДА» and the left
 * chevron, and the sliver between the right chevron and the plate edge — so the
 * two arrows read as a mirrored pair around the row. It matches `RAIL_LABEL.pad`
 * on purpose: the caption sits that far from its own edge, and the control then
 * holds one rhythm instead of two. `row` is the gap to the card row on both
 * ends; the row's own padding counts towards it.
 */
export const RAIL_ARROW_AIR = { outer: 6, row: 2 } as const

/** Panel width that holds `count` equal cards, padding and gaps included. */
export function railWidth(count: number): number {
	return RAIL.pad * 2 + count * RAIL.cardWidth + Math.max(0, count - 1) * RAIL.gap
}
