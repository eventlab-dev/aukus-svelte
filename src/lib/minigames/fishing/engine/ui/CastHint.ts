import { Container, Graphics, Sprite, type Texture } from 'pixi.js'
import { drawTapIcon, makeText } from './theme'
import { anchorInk, inkWidth } from './textInk'
import { UI } from './palette'
import { TEXT } from '../texts'

/**
 * Gap between the label and the badge, in pixels.
 *
 * Four read as two separate things that happened to stand next to each other;
 * flush to zero read as one block with a seam. Two is the seam a prompt needs:
 * the outlined word and the pictogram are one unit, and the badge is still
 * clearly its own mark. Three left the pictogram floating a pixel off the word's
 * contour, which the outline makes visible: the two marks are read as one caption
 * or not at all.
 *
 * The gap is measured from the *ink* of the word (see {@link inkWidth}), not
 * from its advance box: the pixel font leaves about five empty pixels after the
 * last glyph at this size, which used to be added on top of this gap and made
 * the badge look pushed away from the prompt.
 */
const GAP = 2
/** Height of the idle float above and below the anchor, in scene pixels. */
const FLOAT_RISE = 2.2
/** Radians per second of that float: a full rise-and-fall takes ~4 s. */
const FLOAT_RATE = 1.55
/** The pictogram is drawn in this box and scaled to the requested badge. */
const ICON_BOX = 16

export interface CastHintOptions {
	/** Mouse with a lit left button, for a fine pointer. */
	mouse: Texture
	/** Draw a fingertip instead of the mouse: no button to press on a phone. */
	touch: boolean
	/** Size of the prompt word, in virtual pixels. */
	labelSize: number
	/** Side of the pictogram, in virtual pixels. */
	badgeSize: number
}

/**
 * Small "ready to cast" prompt above the angler. It only appears while the
 * player can start a new cast (idle), and disappears as soon as the button or
 * the finger goes down.
 *
 * It is drawn as outlined text plus one pictogram, with no plate: the prompt has
 * to read as a caption over the water, not as a dialog in front of it. The
 * pictogram is a single sprite from the input-prompt set — a mouse with its left
 * button lit — instead of the mouse-and-stopwatch pair the UI used to draw by
 * hand: the pack's art says "press this" with one mark, where the pair needed
 * the player to read two shapes. On a touch screen the same slot holds a drawn
 * fingertip: there is no left button to light up, and the pack has no tap mark.
 */
export class CastHint extends Container {
	private readonly inner = new Container()
	private time = 0

	constructor(x: number, y: number, options: CastHintOptions) {
		super()
		this.eventMode = 'none'
		this.interactiveChildren = false

		const { labelSize, badgeSize } = options
		const label = makeText(TEXT.game.readyToCast, {
			size: labelSize,
			weight: 800,
			color: UI.text,
			letterSpacing: 0.6,
			// The outline is what replaces the plate: it keeps the words legible over
			// both the bright snow bank and the dark water. It is the interface's one
			// contour (`TEXT_OUTLINE`), so the prompt carries the same edge as the
			// catch tags it shares the water with.
			outline: true
		})
		anchorInk(label, 'left')

		// Measured from the ink, not the advance box, and measured on *this* label:
		// the touch prompt is a size up, so the width is a property of the instance.
		const ink = inkWidth(label)
		const width = ink + GAP + badgeSize
		const left = -width / 2
		label.position.set(left, 0)
		this.inner.addChild(label)

		if (options.touch) {
			const mark = new Graphics()
			drawTapIcon(mark)
			mark.scale.set(badgeSize / ICON_BOX)
			mark.position.set(left + ink + GAP, -badgeSize / 2)
			this.inner.addChild(mark)
		} else {
			// The badge is anchored on its left edge and its middle, so it sits
			// against the word's ink with exactly {@link GAP} between them, on the
			// label's centre line.
			const mouse = new Sprite(options.mouse)
			mouse.anchor.set(0, 0.5)
			mouse.scale.set(badgeSize / Math.max(1, options.mouse.width))
			mouse.position.set(left + ink + GAP, 0)
			this.inner.addChild(mouse)
		}

		this.addChild(this.inner)
		this.position.set(x, y)
		this.visible = false
	}

	tick(dt: number): void {
		this.time += dt
		// A slow, continuous drift: the prompt rises a couple of pixels above its
		// anchor and settles back, on a sine, forever. The amplitude has to be a
		// few pixels rather than the half-pixel nudge the old version used: the
		// renderer snaps positions to the pixel grid, so a very small amplitude
		// spends most of its cycle rounding to the same row and reads as a twitch
		// instead of a float. Over this height the snap is a step every few frames,
		// which is exactly how the rest of the pixel art moves.
		this.inner.y = -Math.sin(this.time * FLOAT_RATE) * FLOAT_RISE
		// Alpha breathes on a different clock, so the loop never looks mechanical.
		const wave = Math.sin(this.time * 2.6)
		this.inner.alpha = 0.88 + ((wave + 1) / 2) * 0.12
	}
}
