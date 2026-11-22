import { Container, Text } from 'pixi.js'
import { VIEW } from '../config'
import { clamp } from '../utils'
import { makeText } from './theme'
import { inkAnchorBottomY } from './textInk'

interface Floater {
	text: Text
	life: number
	maxLife: number
	vy: number
	/** Seconds to wait before the label appears; it does not age while hidden. */
	delay: number
	/**
	 * Seconds over which the label fades out, or `null` for the layer's own tail.
	 * A tag that is being cut short with the round (`fadeOut`) fades over the
	 * whole of its remaining life instead of holding at full strength first.
	 */
	fade: number | null
}

/**
 * Short-lived floating labels (catch feedback, early-hook warnings). Every
 * label rises and fades on its own; the layer never takes pointer events, so
 * it can sit above the HUD without stealing clicks.
 */
export class FloaterLayer extends Container {
	private readonly floaters: Floater[] = []

	constructor() {
		super()
		this.eventMode = 'none'
	}

	add(
		value: string,
		x: number,
		y: number,
		color: number,
		size = 14,
		life = 1.1,
		vy = -28,
		anchorX = 0.5,
		delay = 0
	): void {
		const text = makeText(value, {
			size,
			weight: 800,
			color,
			align: anchorX === 0 ? 'left' : 'center',
			lineHeight: size + 1,
			// The one contour of the interface (`TEXT_OUTLINE`): a tag has to read
			// over water and over the bright snow bank alike.
			outline: true
		})
		text.anchor.y = inkAnchorBottomY(text)
		// A centred tag over an angler near the shore would otherwise run off the
		// playfield; keep it fully visible.
		const safeX = anchorX === 0 ? x : clamp(x, text.width / 2 + 4, VIEW.width - text.width / 2 - 4)
		// The same for the top edge, which the catch tag reaches for: it hangs off
		// the top of the light, and a mythic burst on the high pier lifts a
		// three-line tag most of the way to the frame.
		const safeY = Math.max(y, text.height + 2)
		text.position.set(safeX, safeY)
		text.visible = delay <= 0
		this.addChild(text)
		this.floaters.push({ text, life, maxLife: life, vy, delay, fade: null })
	}

	update(dt: number): void {
		for (let i = this.floaters.length - 1; i >= 0; i -= 1) {
			const floater = this.floaters[i]
			// A delayed label holds its place and its full life until its cue: a tag
			// that has already begun to rise and fade before it is shown would hand
			// the player a half-spent caption.
			if (floater.delay > 0) {
				floater.delay -= dt
				if (floater.delay > 0) continue
				floater.text.visible = true
			}
			floater.life -= dt
			floater.text.y += floater.vy * dt
			// Normally a tag holds at full strength and fades in its own tail. A tag
			// cut with the round carries its fade window instead, so its alpha falls
			// on the same curve as the thing it belongs to.
			const fadeTime = floater.fade ?? Math.min(0.4, floater.maxLife * 0.45)
			floater.text.alpha = floater.life < fadeTime ? Math.max(0, floater.life / fadeTime) : 1
			if (floater.life <= 0) {
				this.removeChild(floater.text)
				floater.text.destroy()
				this.floaters.splice(i, 1)
			}
		}
	}

	/**
	 * Shortens every label's remaining life, so a caption that belongs to a round
	 * being cut short goes with it instead of popping off the screen when the
	 * layer is cleared. Labels still waiting for their cue are left alone: they
	 * are cleared with the rest when the round changes.
	 *
	 * The shortened labels fade across that whole window. They used to keep the
	 * layer's normal tail (55 % of the life at full strength, then a fade), which
	 * left the catch's name tag hanging at full opacity while the fish and its
	 * rays had already begun to dissolve — the caption outlived the thing it
	 * named.
	 */
	fadeOut(seconds: number): void {
		for (const floater of this.floaters) {
			if (floater.life > seconds) {
				floater.life = seconds
				floater.maxLife = seconds
				floater.fade = seconds
			}
		}
	}

	/**
	 * Drops every label at once.
	 *
	 * A caption belongs to the round that raised it, so when the round is cut
	 * short — a skipped catch, a cancelled cast — its tags go with it instead of
	 * hanging over the water the next round is played on. In the normal flow a
	 * tag's life already ends with the round, so this only bites on a cut.
	 */
	clear(): void {
		for (const floater of this.floaters) {
			this.removeChild(floater.text)
			floater.text.destroy()
		}
		this.floaters.length = 0
	}
}
