import { BlurFilter, Sprite, type Texture } from 'pixi.js'
import { UI } from '../palette'

/**
 * The contact shadow behind a codex sprite.
 *
 * Every fish and pearl in the codex is drawn on a light plate, and a sprite with
 * nothing behind it reads as a sticker glued flat onto the well. The shadow is
 * the dark seam the sprite casts onto that plate: a copy of the sprite filled
 * with ink, blurred and sitting *behind* it, so it spreads a little past the
 * contour without tracing a second, harder outline.
 *
 * Three things make it a contact shadow rather than a silhouette:
 *
 * - it is blurred, so its edge fades instead of doubling the art's own contour;
 * - it takes the sprite's whole footprint, not an offset twin of it — the only
 *   offset is a single pixel down, which is the light of the frame;
 * - it sits behind the sprite, not as a puddle at its feet, so it belongs to the
 *   picture rather than to the well.
 *
 * The filter is a separate object because its owner has to destroy it: a
 * container's `destroy` does not free the filters of its children.
 */
export const CONTACT_SHADOW = {
	/** Dark enough to read on the well, transparent enough to stay a shadow. */
	alpha: 0.55,
	/** Light comes from the top of the frame, so the seam sinks by one pixel. */
	offsetY: 1,
	/** Blur of a roster sprite, in pixels. The card portrait blurs wider. */
	blur: { strength: 2, quality: 2 },
	portraitBlur: { strength: 3, quality: 2 }
} as const

/** Blur of one contact shadow. The caller owns it and has to destroy it. */
export function contactShadowFilter(portrait = false): BlurFilter {
	const blur = new BlurFilter(
		portrait ? { ...CONTACT_SHADOW.portraitBlur } : { ...CONTACT_SHADOW.blur }
	)
	// The blur spreads past the sprite's box; without the padding the filter frame
	// would clip the soft edge back into a hard rectangle.
	blur.padding = 6
	return blur
}

/**
 * A shadow sprite for `texture`, wearing `filter`. Meant to be added to its
 * button or card *before* the sprite it shadows.
 */
export function makeContactShadow(texture: Texture, filter: BlurFilter): Sprite {
	const shadow = new Sprite(texture)
	shadow.anchor.set(0.5)
	shadow.tint = UI.ink
	shadow.alpha = CONTACT_SHADOW.alpha
	shadow.eventMode = 'none'
	shadow.filters = [filter]
	return shadow
}
