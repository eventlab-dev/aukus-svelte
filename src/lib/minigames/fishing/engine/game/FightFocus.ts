import { Sprite, Texture } from 'pixi.js'
import { VIEW } from '../config'
import { FIGHT_RADIUS } from './fight'
import { ringOutline } from './fightRing'

/**
 * Extra pixels of clear water around the zone outline.
 *
 * The ring itself wobbles by a couple of pixels; the patch is cut a little
 * wider so the animated outline never touches the dark, and the fade is soft
 * enough that the extra margin is invisible. Skewed generous on purpose: the
 * zone is where the player is looking, and a tight patch pinches the water
 * around the float.
 */
const CLEAR_MARGIN = 14

/** Dim that covers everything the fight does not need. */
const DIM = '5, 11, 28'
/** Opacity of that dim at full strength. */
const DIM_ALPHA = 0.55
/** Width of the soft rim between clear water and full dim, in pixels. */
const FEATHER = 10

/**
 * Darken the whole scene around the fishing zone, keeping the zone itself lit.
 *
 * This replaces the old {@link FightVignette}: a gradient ring *around* the
 * fight read as a photographic vignette, so the corners of the lake stayed
 * legible and the eye was pulled away from the ring. What the fight wants is
 * the opposite — everything but the spot goes dark.
 *
 * The clear patch is cut along the zone's own wobbly contour (see
 * {@link ringOutline}), not as a circle or an ellipse: the dark edge and the
 * ring edge are then two views of one shape, so the spot reads as a patch of
 * open water rather than as a spotlight. The stamina bars are deliberately *not*
 * part of the patch — they are drawn above this layer, so they stay crisp
 * without the water having to be left clear behind them.
 *
 * The texture is rebuilt once per fight, because the patch follows the float.
 */
export class FightFocus extends Sprite {
	private opacity = 0
	private textureOwned = false

	constructor() {
		super(Texture.WHITE)
		this.eventMode = 'none'
		this.position.set(0, 0)
		this.visible = false
	}

	/** Centres the clear patch on the fight anchor and rebuilds the dim. */
	focusAt(x: number, y: number): void {
		this.texture = createFocusTexture(x, y)
		this.textureOwned = true
		// Sized *after* the swap: the sprite scales to its texture, so measuring
		// against the 1×1 placeholder first would leave it blown up.
		this.width = VIEW.width
		this.height = VIEW.height
	}

	/** Eases to full dim while `active`, back to clear otherwise. */
	update(dt: number, active: boolean): void {
		const target = active ? 1 : 0
		// In with the hook, out with the landing: the way out is slower, so the
		// lake does not snap back the instant the fish is lifted.
		const timeConstant = target > this.opacity ? 0.18 : 0.38
		this.opacity += (target - this.opacity) * (1 - Math.exp(-dt / timeConstant))

		if (this.opacity < 0.005) {
			this.visible = false
			return
		}
		this.visible = true
		this.alpha = this.opacity
	}

	destroy(options?: Parameters<Sprite['destroy']>[0]): void {
		// The generated texture is not shared with anything else.
		if (this.textureOwned) {
			this.texture.destroy(true)
			this.textureOwned = false
		}
		super.destroy(options)
	}
}

/** One full-view dim with a soft hole cut along the zone outline. */
function createFocusTexture(cx: number, cy: number): Texture {
	const canvas = document.createElement('canvas')
	canvas.width = VIEW.width
	canvas.height = VIEW.height
	const ctx = canvas.getContext('2d')
	if (!ctx) throw new Error('[fishing] 2D canvas is unavailable')

	ctx.fillStyle = `rgba(${DIM}, ${DIM_ALPHA})`
	ctx.fillRect(0, 0, canvas.width, canvas.height)

	// Erase the zone. The blur is what keeps the rim from looking cut out; where
	// `ctx.filter` is unsupported it is simply ignored and the edge is crisp.
	ctx.globalCompositeOperation = 'destination-out'
	ctx.filter = `blur(${FEATHER / 2}px)`
	const outline = ringOutline(cx, cy, FIGHT_RADIUS + CLEAR_MARGIN, 0, 0)
	ctx.beginPath()
	ctx.moveTo(outline[0], outline[1])
	for (let i = 2; i < outline.length; i += 2) {
		ctx.lineTo(outline[i], outline[i + 1])
	}
	ctx.closePath()
	ctx.fillStyle = 'rgba(0, 0, 0, 1)'
	ctx.fill()
	ctx.filter = 'none'

	const texture = Texture.from(canvas)
	texture.source.scaleMode = 'linear'
	return texture
}
