import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { TEXT } from '../texts'
import { UI } from './palette'
import { makeText } from './theme'
import { anchorInk } from './textInk'

/**
 * The stub a phone gets while it is held in portrait.
 *
 * The whole interface — the frame, the HUD, the codex, the fight — is laid out
 * for a wide 480×270 frame, and squeezing it into a portrait window shrinks it
 * to a quarter of the screen with a 13 px button. So the phone is not given a
 * smaller game: it is asked to turn.
 *
 * It lives in **screen** space, not in the letterboxed world: it has to cover
 * the black bars too, and it is drawn in CSS pixels so its size does not depend
 * on how the frame happens to be fitted. Like everything else here it is Pixi —
 * no DOM overlay.
 */
export class RotateNotice extends Container {
	private readonly backdrop = new Graphics()
	private readonly mark = new Graphics()
	private readonly title: Text
	private readonly hint: Text
	private iconSize = 64

	constructor() {
		super()
		this.eventMode = 'none'
		this.visible = false

		this.addChild(this.backdrop)
		this.addChild(this.mark)

		this.title = makeText(TEXT.mobile.rotateTitle, {
			size: 20,
			weight: 800,
			color: UI.text,
			align: 'center',
			letterSpacing: 1
		})
		anchorInk(this.title, 'center')
		this.addChild(this.title)

		this.hint = makeText(TEXT.mobile.rotateHint, {
			size: 12,
			weight: 500,
			color: UI.textMuted,
			align: 'center'
		})
		anchorInk(this.hint, 'center')
		this.addChild(this.hint)
	}

	/** True while the stub covers the frame and takes the taps. */
	get isShown(): boolean {
		return this.visible
	}

	/**
	 * Fits the stub to the canvas and re-centres its block. Called on every
	 * resize, so turning the phone back to landscape re-fits it before it is
	 * hidden.
	 */
	layout(width: number, height: number): void {
		const w = Math.max(1, Math.floor(width))
		const h = Math.max(1, Math.floor(height))
		this.hitArea = new Rectangle(0, 0, w, h)
		this.backdrop.clear()
		// Opaque on purpose: this is a stub, not a dimmer. A half-transparent field
		// let the menu underneath read through, which looked like a broken frame
		// rather than a game asking to be turned.
		this.backdrop.rect(0, 0, w, h).fill(UI.ink)

		// The copy is sized in CSS pixels here: a phone in portrait is the one
		// place where the virtual frame scale must not decide how big the words are.
		const titleSize = Math.round(Math.min(22, Math.max(18, w * 0.052)))
		const hintSize = Math.max(12, Math.round(titleSize * 0.62))
		if (this.title.style.fontSize !== titleSize) {
			this.title.style.fontSize = titleSize
			this.hint.style.fontSize = hintSize
			anchorInk(this.title, 'center')
			anchorInk(this.hint, 'center')
		}

		this.iconSize = Math.round(Math.min(96, Math.max(56, Math.min(w, h) * 0.18)))
		const gapBadge = Math.round(titleSize * 0.8)
		const gapText = Math.round(hintSize * 0.5)
		const block = this.iconSize + gapBadge + titleSize + gapText + hintSize
		const top = Math.max(0, Math.round((h - block) / 2))
		const centreX = Math.round(w / 2)

		drawRotateMark(this.mark, this.iconSize)
		this.mark.position.set(centreX - this.iconSize / 2, top)
		this.title.position.set(centreX, top + this.iconSize + gapBadge)
		this.hint.position.set(centreX, top + this.iconSize + gapBadge + titleSize + gapText)
	}

	/** Shows or hides the stub; a shown stub swallows every tap. */
	setShown(shown: boolean): void {
		if (this.visible === shown) return
		this.visible = shown
		this.eventMode = shown ? 'static' : 'none'
	}
}

/**
 * A portrait phone between two turning chevrons, drawn on the same pixel grid
 * as the rest of the interface: the window chrome is ink and periwinkle, the
 * gesture is ice.
 */
function drawRotateMark(g: Graphics, size: number): void {
	const u = size / 32
	const px = (v: number): number => Math.round(v * u)
	g.clear()

	// The handset, held the wrong way round.
	g.roundRect(px(10), px(4), px(12), px(24), px(2)).stroke({
		width: Math.max(1, px(1.5)),
		color: UI.periwinkle,
		alignment: 0
	})
	g.rect(px(12), px(7), px(8), px(16)).fill({
		color: UI.surface,
		alpha: 0.45
	})
	g.rect(px(15), px(25), px(2), px(1)).fill(UI.periwinkle)

	// The turn: one chevron each side, the pair reading as a rotation.
	const chevron = (x: number, dir: number): void => {
		g.moveTo(px(x + 3 * dir), px(11))
			.lineTo(px(x), px(16))
			.lineTo(px(x + 3 * dir), px(21))
			.stroke({ width: Math.max(1, px(2)), color: UI.ice, alignment: 0 })
	}
	chevron(2, 1)
	chevron(27, -1)
}
