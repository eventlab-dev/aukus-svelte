import { Container, Graphics, Rectangle } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import type { AreaId, WeatherId } from '../types'
import { UI } from './palette'
import { drawPanel } from './theme'
import { WeatherRail } from './weatherRail'
import { RAIL_HEIGHT, RAIL_SLOTS, railSteps, railWidth } from './weatherRailLayout'

/**
 * Sky rail: the live weather period and the ones behind it, on one slim card at
 * the bottom of the round.
 *
 * It reads like a compact forecast strip: one panel holding a row of cards, each
 * one carrying the weather glyph beside two captions — the clock (or «СЕЙЧАС»
 * for the live period) over the name of the sky. The panel is deliberately half
 * the height of the corner travel cards: it is a readout, so it must not compete
 * with the pictures next to it. The row is always {@link RAIL_SLOTS} cards wide
 * and shows the next four fronts, one each, so the widget never reflows while
 * the player is reading it and a run of one sky never hides the fronts behind
 * it.
 *
 * The row itself lives in {@link WeatherRail}: when a front expires it rolls one
 * place left instead of blinking — the card that becomes «now» crossfades its
 * clock time into the live caption, and the front that just entered the forecast
 * slides in from the right edge.
 */
const HEIGHT = RAIL_HEIGHT
/** Sits on the same bottom line as the travel cards in the corners. */
const MARGIN = 8
/** Ink plate laid over the panel while the fight focus is up. */
const DIM = 0.42

export class WeatherForecast extends Container {
	private readonly game: GameContext
	private readonly areaId: AreaId
	/** Panel frame. The cards and their clip live in `rail`. */
	private readonly band = new Graphics()
	private readonly rail = new WeatherRail()
	/** Dark wash laid over the panel while the fight focus is up. */
	private readonly dimmer = new Graphics()
	/** Panel width: fixed, the rail always shows the same number of slots. */
	private span = railWidth(RAIL_SLOTS)
	/** What the rail was last built from, so a still frame rebuilds nothing. */
	private painted = ''
	private dimmed = false

	constructor(game: GameContext, areaId: AreaId) {
		super()
		this.game = game
		this.areaId = areaId
		this.position.set(Math.round((VIEW.width - this.span) / 2), VIEW.height - MARGIN - HEIGHT)
		// The rail covers water: it swallows its own clicks like the HUD cards do,
		// otherwise a click on it would cast a line into the lake behind it.
		this.eventMode = 'static'
		this.cursor = CURSORS.default
		this.hitArea = new Rectangle(0, 0, this.span, HEIGHT)

		this.band.eventMode = 'none'
		this.rail.eventMode = 'none'
		this.dimmer.eventMode = 'none'
		this.addChild(this.band, this.rail, this.dimmer)

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

	update(dt: number): void {
		this.refresh(true)
		this.rail.update(dt)
	}

	/**
	 * Rebuilds the strip when the promised fronts changed. `animate` is false for
	 * the first build, which the player should simply see in place.
	 */
	private refresh(animate: boolean): void {
		const clock = this.game.clock
		// Exactly the fronts the rail draws: one card each, no folding.
		const steps = railSteps(clock.forecastFor(this.areaId, RAIL_SLOTS))
		if (steps.length === 0) return

		// The length is part of the signature: the same sky can stay for a shorter
		// or longer front, and the rail's clock caption has to follow it.
		const signature = steps.map((step) => `${step.weather}:${Math.round(step.length)}`).join(',')
		if (signature === this.painted) return
		this.painted = signature
		const minutes = clock.minutes

		if (!animate || this.rail.weathers().length === 0) {
			this.rail.rebuild(steps, minutes, animate)
			return
		}

		// Same skies in the same order: the queue was re-rolled under an identical
		// row. Only the captions can have moved, so refresh them in place without a
		// blink.
		const old = this.rail.weathers()
		if (old.length === steps.length && steps.every((step, index) => step.weather === old[index])) {
			this.rail.retime(steps, minutes)
			return
		}

		// One front expired and the row simply rolls left: the new row is the old
		// row minus its head, with the front that entered the forecast appended.
		const removed = this.slideSize(old, steps)
		if (removed > 0) {
			this.rail.roll(steps, minutes, removed)
			return
		}
		this.rail.rebuild(steps, minutes, true)
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

	/** Paints the panel and the focus plate from the current row. */
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
	}
}
