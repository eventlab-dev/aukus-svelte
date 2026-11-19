import { Container, Graphics, Rectangle, Sprite, Text, type Texture } from 'pixi.js'
import { CURSORS } from '../cursors'
import type { Focusable } from './FocusGroup'
import { UI } from './palette'
import { makeText, setText } from './theme'
import { anchorInk } from './textInk'
import { TapGuard } from './tapSlop'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'card'
export interface ButtonOptions {
	label?: string
	width?: number
	height?: number
	variant?: ButtonVariant
	size?: number
	onClick?: () => void
	/** Draws a 16x16 icon centered in the button instead of a label. */
	icon?: (g: Graphics) => void
	/**
	 * A 16×16 icon texture, drawn instead of `icon`'s painted mark.
	 *
	 * The interface tiles keep their own pixels — a dark outline with the light
	 * glyph inside — so they are drawn as a sprite rather than traced into
	 * `Graphics`. Nearest sampling comes from the shared asset loader, and the
	 * sprite sits in the same 16 px box the painted marks use.
	 */
	iconTexture?: Texture
	/**
	 * Magnification of the icon, whose art is always drawn in a 16 px box. A touch
	 * screen grows the button around its mark and passes the same factor, so the
	 * glyph fills the bigger frame instead of sitting in it. 1 on a mouse.
	 */
	iconScale?: number
	/**
	 * Extra hit area around the visible frame, in pixels, on each side. A square
	 * control that grows for a finger is still smaller than a fingertip, so the
	 * press is taken a few pixels outside the chrome it paints.
	 */
	hitPad?: number
	/** Selected state for tabs: ice-white fill and a dark label. */
	selected?: boolean
	/**
	 * Draw the `>…<` selection marks around the label. Off for icon-like labels
	 * such as the codex's «х», where the marks would read as a second glyph.
	 */
	marks?: boolean
	/**
	 * Mutes the interface cue this button would play on hover and press, for
	 * controls that are auditioning a sound of their own.
	 */
	quiet?: boolean
	/**
	 * Drops every piece of chrome — fill, frame, bevel and the focus ring — and
	 * keeps only the hit area. For input surfaces that are painted by the
	 * container around them, such as the codex roster, where the grid draws its
	 * own hairlines and one outline slides over the cells.
	 */
	bare?: boolean
}

type SoundKind = 'hover' | 'click'

let soundHandler: ((kind: SoundKind) => void) | null = null

export function setUiSoundHandler(handler: ((kind: SoundKind) => void) | null): void {
	soundHandler = handler
}

export class Button extends Container implements Focusable {
	readonly background = new Graphics()
	private readonly labelText: Text | null = null
	/**
	 * Selection marks, drawn as their own glyphs beside the label.
	 *
	 * They used to be part of the label string (`>ТЕКСТ<`). Rewriting the string
	 * made Pixi re-lay the whole line out, and the word under the marks shifted
	 * by a pixel — a hover that moves the text it is highlighting reads as a
	 * rendering bug. Two separate texts never touch the label's layout.
	 */
	private readonly markLeft: Text | null = null
	private readonly markRight: Text | null = null
	private readonly iconLayer = new Graphics()
	/** Sprite form of a tile icon; null for the painted marks. */
	private readonly iconSprite: Sprite | null = null
	private readonly widthValue: number
	private readonly heightValue: number
	private readonly variant: ButtonVariant
	private readonly fontSize: number

	private hovered = false
	private focused = false
	private pressed = false
	private enabled = true
	private isSelected = false
	private readonly quiet: boolean
	private readonly marksEnabled: boolean
	private readonly bare: boolean
	private readonly iconScale: number
	/** Where the press started, so a drag off the button is not a click. */
	private readonly tap = new TapGuard()
	private onClick?: () => void

	constructor(options: ButtonOptions) {
		super()
		this.variant = options.variant ?? 'secondary'
		this.fontSize = options.size ?? 11
		this.heightValue = options.height ?? 22
		this.onClick = options.onClick
		this.isSelected = options.selected ?? false
		this.quiet = options.quiet ?? false
		this.marksEnabled = options.marks ?? true
		this.bare = options.bare ?? false
		this.iconScale = options.iconScale ?? 1

		if (options.label !== undefined) {
			this.labelText = makeText(options.label, {
				size: this.fontSize,
				weight: 600,
				color: this.labelOnBright ? UI.textOnBright : UI.text,
				align: 'center'
			})
			anchorInk(this.labelText, 'center')
			this.addChild(this.labelText)

			if (this.marksEnabled) {
				const markStyle = {
					size: this.fontSize,
					weight: 600,
					color: this.labelOnBright ? UI.textOnBright : UI.text
				}
				this.markLeft = makeText('>', markStyle)
				anchorInk(this.markLeft, 'right')
				this.markLeft.visible = false
				this.markRight = makeText('<', markStyle)
				anchorInk(this.markRight, 'left')
				this.markRight.visible = false
			}
		}

		this.widthValue =
			options.width ??
			Math.max(
				72,
				options.icon || options.iconTexture ? 24 : Math.ceil((this.labelText?.width ?? 40) + 24)
			)

		if (options.iconTexture) {
			this.iconSprite = new Sprite(options.iconTexture)
			this.iconSprite.eventMode = 'none'
		}

		this.addChild(this.background)
		if (this.iconSprite) this.addChild(this.iconSprite)
		this.addChild(this.iconLayer)
		if (this.labelText) this.addChild(this.labelText)
		if (this.markLeft) this.addChild(this.markLeft)
		if (this.markRight) this.addChild(this.markRight)

		this.eventMode = 'static'
		this.cursor = CURSORS.pointer
		const hitPad = options.hitPad ?? 0
		this.hitArea = new Rectangle(
			-hitPad,
			-hitPad,
			this.widthValue + hitPad * 2,
			this.heightValue + hitPad * 2
		)

		this.on('pointerover', (event) => {
			// A finger is not a hover: on a touch screen the browser delivers
			// `pointerover` on every press, which played the hover cue right before
			// the click and lit the button with no pointer to explain it.
			if (event.pointerType === 'touch') return
			this.hovered = true
			if (!this.quiet) soundHandler?.('hover')
			this.redraw()
		})
		this.on('pointerout', () => {
			this.hovered = false
			this.pressed = false
			this.redraw()
		})
		this.on('pointerdown', (event) => {
			this.tap.start(event.global.x, event.global.y)
			this.pressed = true
			this.redraw()
		})
		this.on('pointerup', () => {
			this.pressed = false
			this.redraw()
		})
		this.on('pointerupoutside', () => {
			this.pressed = false
			this.tap.cancel()
			this.redraw()
		})
		this.on('pointertap', (event) => {
			// `pointertap` fires for a drag that starts and ends on this button too.
			// A card is wide enough that a thumb can cross it while casting, which
			// used to change the water body instead of casting.
			if (!this.tap.end(event.global.x, event.global.y)) return
			this.activate()
		})

		if (!this.iconSprite && options.icon) {
			options.icon(this.iconLayer)
		}

		this.layoutContent()
		this.redraw()
	}

	/**
	 * True when this button's fill is light enough to need dark copy. Primary,
	 * secondary and selected buttons are light; ghost and danger are not.
	 */
	private get labelOnBright(): boolean {
		return this.isSelected || this.variant === 'primary' || this.variant === 'secondary'
	}

	setLabel(label: string): void {
		if (this.labelText) {
			setText(this.labelText, label)
			this.layoutContent()
		}
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		this.eventMode = enabled ? 'static' : 'none'
		this.cursor = enabled ? CURSORS.pointer : CURSORS.default
		this.alpha = enabled ? 1 : 0.5
		this.redraw()
	}

	setFocused(focused: boolean): void {
		if (this.focused === focused) return
		this.focused = focused
		this.redraw()
	}

	setSelected(selected: boolean): void {
		if (this.isSelected === selected) return
		this.isSelected = selected
		this.redraw()
	}

	/**
	 * Marks the label as the current one, the way a dialogue writes the line the
	 * player is on. The glyphs sit just outside the word, so the word itself
	 * never moves when the marks come and go.
	 */
	private layoutMarks(): void {
		if (!this.labelText || !this.markLeft || !this.markRight) return
		const centre = this.widthValue / 2
		const half = Math.ceil(this.labelText.width / 2)
		this.markLeft.position.set(centre - half - 1, this.heightValue / 2)
		this.markRight.position.set(centre + half + 1, this.heightValue / 2)
	}

	activate(): void {
		if (!this.enabled) return
		if (!this.quiet) soundHandler?.('click')
		this.onClick?.()
	}

	private layoutContent(): void {
		const centerY = this.heightValue / 2
		if (this.labelText) {
			this.labelText.position.set(this.widthValue / 2, centerY)
		}
		if (this.iconSprite) {
			// A tile fills its 16 px canvas, unlike the painted marks that live in
			// a 10 px box, so the button's own step would overrun the frame. The
			// sprite steps down until the whole canvas — transparent border
			// included — clears the frame.
			const fit = Math.max(1, Math.floor((Math.min(this.widthValue, this.heightValue) - 2) / 16))
			const scale = Math.min(this.iconScale, fit)
			const box = 16 * scale
			this.iconSprite.scale.set(scale)
			// Whole-pixel placement: the 16 px grid is the one the art was drawn
			// on, and a half-pixel offset would resample it.
			this.iconSprite.position.set(
				Math.round((this.widthValue - box) / 2),
				Math.round(centerY - box / 2)
			)
		} else if (this.iconLayer) {
			// The mark is drawn in a 16 px box and the box is scaled, not redrawn:
			// one set of icon painters serves both sizes.
			this.iconLayer.scale.set(this.iconScale)
			const box = 16 * this.iconScale
			this.iconLayer.position.set((this.widthValue - box) / 2, centerY - box / 2)
		}
		this.layoutMarks()
	}

	private redraw(): void {
		const g = this.background
		const width = this.widthValue
		const height = this.heightValue
		const active = this.hovered || this.focused
		g.clear()
		// A bare button is only a hit area: everything it stands for is drawn by the
		// container that owns it, so hover and focus must not paint over it.
		if (this.bare) return

		let fill: number
		let fillActive: number
		let fillPressed: number
		let topLine: number
		const border = UI.ink

		switch (this.variant) {
			case 'primary':
				fill = UI.primary
				fillActive = UI.primaryHover
				fillPressed = UI.primaryPressed
				topLine = UI.periwinkleLight
				break
			case 'danger':
				fill = UI.danger
				fillActive = UI.dangerHover
				fillPressed = UI.dangerPressed
				topLine = UI.rose
				break
			case 'ghost':
				fill = UI.panelAlt
				fillActive = UI.surface
				fillPressed = UI.surface
				topLine = UI.periwinklePale
				break
			case 'card':
				// Dark card for a picture inside it: the preview and its white caption
				// need a surface that the periwinkle button fill would not give them.
				fill = UI.panelAlt
				fillActive = UI.surface
				fillPressed = UI.surface
				topLine = UI.periwinkle
				break
			default:
				fill = UI.periwinkle
				fillActive = UI.periwinkleLight
				fillPressed = UI.periwinklePressed
				topLine = UI.periwinklePale
				break
		}

		if (this.isSelected) {
			fill = UI.primary
			fillActive = UI.primaryHover
			fillPressed = UI.primaryPressed
			topLine = UI.periwinkleLight
		}

		if (this.variant === 'ghost' && !active && !this.isSelected) {
			// Ghost stays unfilled until hovered so a codex grid does not turn into a
			// wall of boxes, but keeps a hairline so every cell still reads as a slot.
			g.rect(0, 0, width, height).stroke({
				width: 1,
				color: UI.periwinkle,
				alpha: 0.5,
				alignment: 0
			})
		} else if (this.variant !== 'ghost' || active || this.isSelected) {
			const color = this.pressed ? fillPressed : active ? fillActive : fill
			const alpha = this.variant === 'ghost' ? (active ? 0.55 : 0) : 1
			if (alpha > 0) {
				g.rect(0, 0, width, height).fill({ color, alpha })
				if (this.variant === 'ghost') {
					// The ghost cells are sockets, not chips: the shade hangs off the
					// top-left lip and the bottom lip catches the light. Drawn the other
					// way round, the hover read as a raised button sitting in the well.
					g.rect(0, 0, width, 2).fill({ color: UI.ink, alpha: 0.28 })
					g.rect(0, 0, 1, height).fill({ color: UI.ink, alpha: 0.16 })
				} else {
					g.rect(0, height - 2, width, 2).fill({
						color: UI.ink,
						alpha: 0.35
					})
				}
				g.rect(0, 0, width, height).stroke({
					width: 1,
					color: border,
					alignment: 0
				})
				if (this.variant === 'ghost') {
					g.rect(1, height - 1, width - 2, 1).fill({
						color: UI.periwinklePale,
						alpha: 0.22
					})
				} else {
					g.rect(1, 1, width - 2, 1).fill({ color: topLine, alpha: 0.5 })
				}
			}
		}

		if (this.focused) {
			// Two pixel rings, not one: the ice ring vanishes on an ice-white
			// primary button, so the indigo ring behind it carries the focus.
			g.rect(-3, -3, width + 6, height + 6).stroke({
				width: 1,
				color: UI.ink,
				alpha: 0.7,
				alignment: 0
			})
			g.rect(-2, -2, width + 4, height + 4).stroke({
				width: 1,
				color: UI.primary,
				alignment: 0
			})
		}

		if (this.iconSprite) {
			this.iconSprite.alpha = this.pressed ? 0.8 : 1
		}
		if (this.iconLayer) {
			this.iconLayer.alpha = this.pressed ? 0.8 : 1
		}
		if (this.labelText) {
			this.labelText.y = height / 2 + (this.pressed ? 1 : 0)
			this.labelText.alpha = this.enabled ? 1 : 0.6
			this.labelText.style.fill = this.labelOnBright ? UI.textOnBright : UI.text
			const fill = this.labelOnBright ? UI.textOnBright : UI.text
			const shown = this.marksEnabled && (this.hovered || this.focused || this.isSelected)
			for (const mark of [this.markLeft, this.markRight]) {
				if (!mark) continue
				mark.visible = shown
				mark.y = height / 2 + (this.pressed ? 1 : 0)
				mark.style.fill = fill
			}
		}
	}
}
