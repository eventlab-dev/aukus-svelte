import { Container, Graphics, Rectangle, type FederatedPointerEvent, type Text } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { TEXT } from '../texts'
import type { AreaId, WeatherId } from '../types'
import { clamp } from '../utils'
import type { ForecastStep } from '../world'
import { UI } from './palette'
import type { UiRect } from './rect'
import { drawPanel, makeText } from './theme'
import { anchorInk, inkWidth } from './textInk'
import { WeatherRail } from './weatherRail'
import {
	RAIL,
	RAIL_ARROW,
	RAIL_ARROW_AIR,
	RAIL_HEIGHT,
	RAIL_HORIZON,
	RAIL_LABEL,
	RAIL_SLOTS,
	railWidth
} from './weatherRailLayout'

/**
 * Sky rail: the live weather period and the ones behind it, on one slim card at
 * the bottom of the round.
 *
 * It reads like a compact forecast strip: one panel holding a row of cards, each
 * one carrying the weather glyph beside two captions — the clock (or «СЕЙЧАС»
 * for the live period) over the name of the sky. The panel is deliberately half
 * the height of the corner travel cards: it is a readout, so it must not compete
 * with the pictures next to it.
 *
 * The card row is a window onto a deeper strip ({@link RAIL_HORIZON} fronts, about
 * two hours of sky). The chevrons at its ends move it one card at a time and the
 * strip itself can be dragged with the pointer; in both cases it is the strip
 * that moves under a fixed frame, never the frame. Scrolling is read-only — it
 * never changes the sky, it only lets the player look further ahead than one
 * screenful. While the window sits at the live end the first card promotes itself
 * to «СЕЙЧАС» and the row rolls left on expiry; scrolled forward, every card is a
 * plain clock face.
 *
 * The left end of the plate carries the widget's own caption, «ПОГОДА», in a
 * block of its own ({@link RAIL_LABEL}): the row names its skies but never said
 * what the whole strip was.
 */
const HEIGHT = RAIL_HEIGHT
/** Sits on the same bottom line as the travel cards in the corners. */
const MARGIN = 8
/** Ink plate laid over the panel while the fight focus is up. */
const DIM = 0.42
/** Distance between two neighbouring card slots, for the drag gesture. */
const SLOT = RAIL.cardWidth + RAIL.gap
/**
 * How far a press may travel before it counts as a drag instead of a click.
 *
 * The strip sits over water and the same press can be the start of a cast; a
 * couple of pixels of tremor in a click must not scroll the forecast.
 */
const DRAG_SLOP = 3

export class WeatherForecast extends Container {
	private readonly game: GameContext
	private readonly areaId: AreaId
	/** The widget's own caption, at the panel's left end. */
	private readonly caption: Text
	/** Panel frame. The cards and their clip live in `rail`. */
	private readonly band = new Graphics()
	private readonly rail = new WeatherRail()
	/** Scroll chevrons at the two ends of the card row. */
	private readonly leftArrow = new Graphics()
	private readonly rightArrow = new Graphics()
	/** Dark wash laid over the panel while the fight focus is up. */
	private readonly dimmer = new Graphics()
	/** Panel width: caption, chevrons and the row, fixed. */
	private readonly span: number
	/** Left edge of the card row inside the panel. */
	private readonly railX: number
	private readonly leftArrowX: number
	private readonly rightArrowX: number
	/** The deeper forecast the strip scrolls through. */
	private steps: readonly ForecastStep[] = []
	/** First front of the visible window, 0 = the live one. */
	private offset = 0
	/** What the whole strip was last built from. */
	private painted = ''
	private dimmed = false
	private dragging = false
	private dragStartX = 0
	private dragStartScroll = 0
	private dragPx = 0

	constructor(game: GameContext, areaId: AreaId) {
		super()
		this.game = game
		this.areaId = areaId

		// The caption is measured before anything is placed: the block it needs is
		// part of the panel's width, and the panel is centred on the frame.
		this.caption = makeText(TEXT.forecast.title, {
			size: 7,
			weight: 800,
			color: UI.textMuted,
			letterSpacing: 0.6
		})
		anchorInk(this.caption, 'left', 'center')
		this.caption.eventMode = 'none'
		this.leftArrowX = RAIL_LABEL.pad + Math.ceil(inkWidth(this.caption)) + RAIL_ARROW_AIR.outer
		// The row's own padding is part of the gap to the chevrons, so the strip
		// takes the chevron's air out of it instead of adding a second gap.
		this.railX = this.leftArrowX + RAIL_ARROW.width + RAIL_ARROW_AIR.row - RAIL.pad
		this.rightArrowX = this.railX + railWidth(RAIL_SLOTS) - RAIL.pad + RAIL_ARROW_AIR.row
		// Both chevrons carry the same outer air: the left one indents from the
		// caption, the right one from the plate edge, so the pair reads as mirrored.
		this.span = this.rightArrowX + RAIL_ARROW.width + RAIL_ARROW_AIR.outer
		this.position.set(Math.round((VIEW.width - this.span) / 2), VIEW.height - MARGIN - HEIGHT)
		// The rail covers water: it swallows its own clicks like the HUD cards do,
		// otherwise a click on it would cast a line into the lake behind it.
		this.eventMode = 'static'
		this.cursor = CURSORS.grab
		this.hitArea = new Rectangle(0, 0, this.span, HEIGHT)

		this.band.eventMode = 'none'
		this.rail.eventMode = 'none'
		this.dimmer.eventMode = 'none'
		this.caption.position.set(RAIL_LABEL.pad, Math.round(HEIGHT / 2))
		this.rail.position.set(this.railX, 0)
		for (const [arrow, x] of [
			[this.leftArrow, this.leftArrowX],
			[this.rightArrow, this.rightArrowX]
		] as const) {
			arrow.cursor = CURSORS.pointer
			// The chevron is four pixels of ink; the press box is centred on it and
			// three times as wide, because the arrows sit on a 20 px strip.
			arrow.hitArea = new Rectangle(
				Math.round((RAIL_ARROW.width - RAIL_ARROW.hit) / 2),
				0,
				RAIL_ARROW.hit,
				HEIGHT
			)
			arrow.position.set(x, 0)
		}
		this.addChild(this.band, this.caption, this.leftArrow, this.rail, this.rightArrow, this.dimmer)

		this.leftArrow.on('pointertap', () => this.scrollBy(-1))
		this.rightArrow.on('pointertap', () => this.scrollBy(1))
		this.on('pointerdown', (event: FederatedPointerEvent) => this.beginDrag(event))
		this.on('globalpointermove', (event: FederatedPointerEvent) => this.moveDrag(event))
		this.on('pointerup', () => this.endDrag())
		this.on('pointerupoutside', () => this.endDrag())

		this.refresh(false)
		// The panel frame is painted here, not from a resize: the rail is a fixed
		// four slots wide now, and its only other painter is the fight dimmer — so
		// without this call the widget had cards but no plate until a fight began.
		this.paint()
	}

	/** Puts the panel back under the fight focus without making it translucent. */
	setDimmed(dimmed: boolean): void {
		if (this.dimmed === dimmed) return
		this.dimmed = dimmed
		this.paint()
	}

	/** True inside the rail, for the cast cursor and for click swallowing. */
	hitTest(x: number, y: number): boolean {
		return (
			this.visible &&
			x >= this.x - 2 &&
			x <= this.x + this.span + 2 &&
			y >= this.y - 2 &&
			y <= this.y + HEIGHT + 2
		)
	}

	/**
	 * Rect of the rail, in scene pixels.
	 *
	 * The lesson note is laid out around the interface: the rail is a read-out,
	 * not a control, but a note dropped over it hid the sky the same round is
	 * played under.
	 */
	reservedRects(): UiRect[] {
		return [{ x: this.x, y: this.y, width: this.span, height: HEIGHT }]
	}

	update(dt: number): void {
		this.refresh(true)
		this.rail.update(dt)
	}

	/** Last window index the strip can start at. */
	private maxOffset(): number {
		return Math.max(0, this.steps.length - RAIL_SLOTS)
	}

	/** Moves the visible window by whole cards, clamped to the horizon. */
	private scrollBy(delta: number): void {
		const next = clamp(this.offset + delta, 0, this.maxOffset())
		if (next === this.offset) return
		this.offset = next
		this.rail.scrollTo(this.offset * SLOT)
		this.paintArrows()
	}

	/**
	 * Rebuilds the strip when the promised fronts changed. `animate` is false for
	 * the first build, which the player should simply see in place: the roll
	 * animation belongs to the live end of the strip.
	 */
	private refresh(animate: boolean): void {
		const clock = this.game.clock
		const hours = clock.forecastFor(this.areaId, RAIL_HORIZON)
		if (hours.length === 0) return
		this.steps = hours

		// The length is part of the signature: the same sky can stay for a shorter
		// or longer front, and the rail's clock caption has to follow it.
		const signature = hours.map((step) => `${step.weather}:${Math.round(step.length)}`).join(',')
		if (signature === this.painted) {
			this.offset = clamp(this.offset, 0, this.maxOffset())
			return
		}
		this.painted = signature
		const minutes = clock.minutes

		if (!animate || this.rail.weathers().length === 0) {
			this.rail.rebuild(hours, minutes, animate)
			this.settleScroll()
			return
		}

		// Same skies in the same order: the queue was re-rolled under an identical
		// row. Only the captions can have moved, so refresh them in place without a
		// blink.
		const old = this.rail.weathers()
		if (old.length === hours.length && hours.every((step, index) => step.weather === old[index])) {
			this.rail.retime(hours, minutes)
			this.offset = clamp(this.offset, 0, this.maxOffset())
			this.settleScroll()
			return
		}

		// One front expired and the row simply rolls left: the new row is the old
		// row minus its head, with the front that entered the forecast appended.
		const removed = this.slideSize(old, hours)
		if (removed > 0) {
			this.rail.roll(hours, minutes, removed)
			// The window follows the schedule, not the slot numbers: the fronts the
			// player was reading keep their cards, so a scrolled view does not jump
			// under the pointer when the live front turns over.
			this.offset = clamp(this.offset - removed, 0, this.maxOffset())
			this.settleScroll()
			return
		}
		this.rail.rebuild(hours, minutes, true)
		this.offset = clamp(this.offset, 0, this.maxOffset())
		this.settleScroll()
	}

	/** Applies the window position to the strip, unless a drag owns it. */
	private settleScroll(): void {
		if (this.dragging) return
		this.rail.setScroll(this.offset * SLOT)
		this.paintArrows()
	}

	/**
	 * How many cards left the head of the row, when the rest of it is the same
	 * sequence. Returns 0 when the new row cannot be reached by a plain slide.
	 */
	private slideSize(old: readonly WeatherId[], steps: readonly { weather: WeatherId }[]): number {
		if (steps.length !== old.length) return 0
		for (let removed = 1; removed < old.length; removed += 1) {
			let matches = true
			for (let i = removed; i < old.length; i += 1) {
				if (old[i] !== steps[i - removed].weather) {
					matches = false
					break
				}
			}
			if (matches) return removed
		}
		return 0
	}

	// ------------------------------------------------------------ drag gesture

	private beginDrag(event: FederatedPointerEvent): void {
		// A press on a chevron is a click on that chevron, not the start of a drag.
		if (event.target !== this) return
		this.dragging = true
		// Local, not global: the stage is scaled to fit the host, and a global
		// pixel is three local ones at 1440 px wide. Reading the strip in global
		// units made one card of travel out of a third of a card of drag.
		this.dragStartX = event.getLocalPosition(this).x
		this.dragStartScroll = this.rail.scroll
		this.dragPx = 0
		this.rail.stopScroll()
		this.cursor = CURSORS.grabbing
	}

	private moveDrag(event: FederatedPointerEvent): void {
		if (!this.dragging) return
		const dx = event.getLocalPosition(this).x - this.dragStartX
		if (Math.abs(dx) < DRAG_SLOP) return
		this.dragPx = dx
		// Finger left → strip left → later fronts come into the window.
		this.rail.setScroll(this.dragStartScroll - dx)
	}

	private endDrag(): void {
		if (!this.dragging) return
		this.dragging = false
		this.cursor = CURSORS.grab
		const distance = this.dragPx
		this.dragPx = 0
		if (Math.abs(distance) < DRAG_SLOP) {
			// A click, not a drag: leave the window where it was.
			this.rail.setScroll(this.offset * SLOT)
			return
		}
		const slots = Math.round(this.rail.scroll / SLOT)
		this.offset = clamp(slots, 0, this.maxOffset())
		this.rail.scrollTo(this.offset * SLOT)
		this.paintArrows()
	}

	// ------------------------------------------------------------------ paint

	/** Paints the panel, the chevrons and the focus plate. */
	private paint(): void {
		const g = this.band
		g.clear()
		// Solid panel: the rail is a card on the frame, not a tinted window over the
		// water, so waves must never drift through it.
		drawPanel(g, 0, 0, this.span, HEIGHT, {
			fill: UI.panel,
			alpha: 1,
			shadow: true,
			// The cards cover the face, so the panel's bevel would only show in the
			// gaps between them — as a row of raised separator bars.
			inner: false
		})

		// The focus plate covers panel and cards alike, so a fight dims the whole
		// widget rather than leaving a bright hole at the bottom of the frame.
		this.dimmer.clear()
		if (this.dimmed) {
			this.dimmer.rect(0, 0, this.span, HEIGHT).fill({
				color: UI.ink,
				alpha: DIM
			})
		}
		this.paintArrows()
	}

	/**
	 * Draws the two chevrons. Both are always on the plate — a control that
	 * vanishes at an end reads as a rendering bug, not as "there is nothing
	 * further" — and the one that cannot scroll is drawn muted and takes no
	 * clicks.
	 */
	private paintArrows(): void {
		const cy = Math.round(HEIGHT / 2)
		const paint = (g: Graphics, dir: -1 | 1, enabled: boolean): void => {
			g.clear()
			g.alpha = 1
			g.eventMode = enabled ? 'static' : 'none'
			g.cursor = enabled ? CURSORS.pointer : CURSORS.default
			// Muted, not invisible: 50 % of the secondary copy still reads as a
			// shape against the panel, while the enabled chevron stays ice-bright.
			const color = enabled ? UI.periwinkleLight : UI.textMuted
			const alpha = enabled ? 1 : 0.5
			for (let i = 0; i < 4; i += 1) {
				const column = dir > 0 ? i : 3 - i
				g.rect(column, cy - 3 + i, 1, 1).fill({ color, alpha })
				g.rect(column, cy + 3 - i, 1, 1).fill({ color, alpha })
			}
		}
		paint(this.leftArrow, -1, this.offset > 0)
		paint(this.rightArrow, 1, this.offset < this.maxOffset())
	}
}
