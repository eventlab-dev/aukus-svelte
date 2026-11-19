import { Container, Graphics, Rectangle } from 'pixi.js'
import type { FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js'
import { CURSORS } from '../cursors'
import { clamp } from '../utils'
import { UI } from './palette'

/**
 * A framed column of controls with its own scrollbar.
 *
 * The tuner's list is longer than the window it lives in, and a panel whose last
 * fader is off the frame is a panel without that fader. The content goes into
 * {@link content}, gets clipped to the frame, and is moved by the bar or by the
 * wheel; nothing here knows what the rows mean.
 */
export const SCROLL_BAR = { width: 4, gap: 3 } as const

export class ScrollColumn extends Container {
	/** Rows are added here; the container scrolls them, the panel places them. */
	readonly content = new Container()
	private readonly frame = new Graphics()
	private readonly barG = new Graphics()
	private readonly maskG = new Graphics()
	private readonly view = new Container()
	private readonly widthValue: number
	private readonly heightValue: number
	private contentHeight = 0
	private offset = 0
	private dragging = false

	constructor(width: number, height: number) {
		super()
		this.widthValue = width
		this.heightValue = height

		this.frame.rect(0, 0, width, height).fill({ color: UI.ink, alpha: 0.32 })
		this.frame.rect(0, 0, width, height).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.35
		})
		this.addChild(this.frame)

		this.maskG.rect(0, 0, width - SCROLL_BAR.width - SCROLL_BAR.gap, height)
		this.maskG.fill(0xffffff)
		this.addChild(this.maskG)
		this.view.mask = this.maskG
		this.view.addChild(this.content)
		this.addChild(this.view)

		this.addChild(this.barG)

		// The whole column takes the wheel and the bar drag: a dev list is expected
		// to scroll wherever the pointer happens to be over it.
		this.eventMode = 'static'
		this.hitArea = new Rectangle(0, 0, width, height)
		this.on('wheel', (event: FederatedWheelEvent) => {
			this.scrollBy(event.deltaY)
			event.preventDefault()
		})
		this.on('pointerdown', (event: FederatedPointerEvent) => this.press(event))
		this.on('globalpointermove', (event: FederatedPointerEvent) => this.drag(event))
		this.on('pointerup', () => this.release())
		this.on('pointerupoutside', () => this.release())
		this.cursor = CURSORS.pointer
	}

	/** Full height of the content; the panel sets it once the rows are in. */
	setContentHeight(height: number): void {
		this.contentHeight = height
		this.offset = clamp(this.offset, 0, this.maxOffset())
		this.apply()
	}

	/** Move the content by `dy` pixels of wheel travel. */
	scrollBy(dy: number): void {
		this.offset = clamp(this.offset + dy * 0.5, 0, this.maxOffset())
		this.apply()
	}

	private press(event: FederatedPointerEvent): void {
		const local = event.getLocalPosition(this)
		// Anywhere on the strip drags it: aiming at a four-pixel thumb is a game of
		// its own, and this is a dev panel.
		if (local.x < this.widthValue - SCROLL_BAR.width - SCROLL_BAR.gap) return
		this.dragging = true
		this.jumpTo(local.y)
	}

	private drag(event: FederatedPointerEvent): void {
		if (!this.dragging) return
		this.jumpTo(event.getLocalPosition(this).y)
	}

	private release(): void {
		this.dragging = false
	}

	/** Centre the thumb on `y`, keeping the thumb's own size in play. */
	private jumpTo(y: number): void {
		const track = this.heightValue
		const thumb = this.thumbHeight()
		const travel = Math.max(1, track - thumb)
		const share = clamp((y - thumb / 2) / travel)
		this.offset = share * this.maxOffset()
		this.apply()
	}

	private maxOffset(): number {
		return Math.max(0, this.contentHeight - this.heightValue)
	}

	private thumbHeight(): number {
		if (this.contentHeight <= this.heightValue) return this.heightValue
		return Math.max(16, (this.heightValue * this.heightValue) / this.contentHeight)
	}

	private apply(): void {
		this.content.y = -Math.round(this.offset)
		this.drawBar()
	}

	private drawBar(): void {
		const g = this.barG
		const x = this.widthValue - SCROLL_BAR.width - 1
		const track = this.heightValue - 2
		const thumb = this.thumbHeight()
		const max = this.maxOffset()
		const y = 1 + (max > 0 ? (this.offset / max) * (track - thumb) : 0)
		g.clear()
		if (max <= 0) return
		g.rect(x, 1, SCROLL_BAR.width, track).fill({
			color: UI.ink,
			alpha: 0.5
		})
		g.rect(x, y, SCROLL_BAR.width, thumb).fill({ color: UI.periwinkle })
	}
}
