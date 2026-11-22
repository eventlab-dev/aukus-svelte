import { Container, Graphics, Text } from 'pixi.js'
import type { WeatherId } from '../types'
import { clamp, easeOutCubic, lerp } from '../utils'
import type { ForecastStep } from '../world'
import { makeRailCard, promoteRailCard, retimeRailCard, type RailCard } from './railCard'
import { RAIL, RAIL_SLOTS, railWidth } from './weatherRailLayout'

/** How long the captions take to fade in after a rebuild, in seconds. */
const FADE = 0.2
/** How long one slot of the leftward slide takes, in seconds. */
const SLIDE_TIME = 0.34
/** How long a chevron scroll takes, in seconds. */
const SCROLL_TIME = 0.2
/** Distance between two neighbouring card slots. */
const SLOT = RAIL.cardWidth + RAIL.gap

/** One card's journey to its new slot in a sliding row. */
interface SlotMotion {
	card: RailCard
	fromX: number
	toX: number
	fromAlpha: number
	toAlpha: number
}

/** The card that becomes «now»: its caption fades from time to the live one. */
interface Promotion {
	card: RailCard
	ghost: Text
	fromIconX: number
	toIconX: number
}

/** A leftward slide in flight. */
interface Slide {
	elapsed: number
	motions: SlotMotion[]
	promotion: Promotion | null
	exiting: RailCard[]
}

/**
 * The row of weather cards inside {@link WeatherForecast}: glyph beside a
 * two-line caption — clock over the name of the sky — centred as one group on
 * the card, clipped to the panel's inner face.
 *
 * The row holds the whole forecast horizon, not just the visible four: the panel
 * is a window onto a strip, and dragging the strip is what shows the fronts
 * behind it. The clip never moves — only the cards under it do ({@link setScroll}
 * and {@link scrollTo}) — so the window keeps its frame while the row slides
 * through it. That is also why the mask is a sibling of the cards and not their
 * parent: a mask that travelled with the row would hide the very fronts the
 * drag is meant to reveal.
 *
 * When a front expires the row does not blink: every card slides one place to
 * the left, the card that becomes «now» crossfades its clock time into the live
 * caption, and the front that just entered the forecast slides in from the right
 * edge, still behind the clip.
 */
export class WeatherRail extends Container {
	/** Card nodes, all in rail coordinates, clipped to the panel's inner face. */
	private readonly art = new Container()
	/** Inner face of the panel: cards slide in and out through this mask. */
	private readonly clip = new Graphics()
	private cards: RailCard[] = []
	/** Panel width the row is laid out for: fixed, the rail never resizes. */
	span = railWidth(RAIL_SLOTS)
	/** Fade progress of `art`, 0..1, used by whole-row rebuilds. */
	private appear = 1
	/** Slide in flight, if any. */
	private slide: Slide | null = null
	/** Scroll position of the strip, in pixels from the live end. */
	private scrollPx = 0
	/** Animated scroll in flight, if any. */
	private scrollFrom = 0
	private scrollToPx = 0
	private scrollElapsed = 0
	private scrollTime = 0

	constructor() {
		super()
		this.art.eventMode = 'none'
		this.addChild(this.art)
		this.addChild(this.clip)
		this.art.mask = this.clip
	}

	/** The sky of each card, left to right; what a slide is matched against. */
	weathers(): WeatherId[] {
		return this.cards.map((card) => card.weather)
	}

	/** How far the strip is scrolled from the live end, in pixels. */
	get scroll(): number {
		return this.scrollPx
	}

	/** How many pixels the strip can travel, for the given number of cards. */
	maxScroll(): number {
		return Math.max(0, this.cards.length - RAIL_SLOTS) * SLOT
	}

	/** Puts the strip at a scroll position without animating. */
	setScroll(px: number): void {
		this.scrollTime = 0
		this.scrollPx = clamp(px, 0, this.maxScroll())
		this.art.x = -this.scrollPx
	}

	/** Glides the strip to a scroll position; the drag uses this on release. */
	scrollTo(px: number, time = SCROLL_TIME): void {
		const target = clamp(px, 0, this.maxScroll())
		if (Math.abs(target - this.scrollPx) < 0.01) {
			this.setScroll(target)
			return
		}
		this.scrollFrom = this.scrollPx
		this.scrollToPx = target
		this.scrollElapsed = 0
		this.scrollTime = time
	}

	/** Drops an animated scroll, so a drag can take the strip over mid-flight. */
	stopScroll(): void {
		this.scrollTime = 0
	}

	/**
	 * Refreshes the clock captions in place. Used when the row's skies did not
	 * change but the schedule behind them did (a debug pin, a re-rolled queue).
	 */
	retime(steps: readonly ForecastStep[], minutes: number): void {
		this.cards.forEach((card, index) => {
			if (index === 0 || index >= steps.length) return
			retimeRailCard(card, steps[index], minutes)
		})
	}

	update(dt: number): void {
		if (this.slide) this.step(dt)
		if (this.scrollTime > 0) this.stepScroll(dt)
		if (this.appear >= 1) return
		this.appear = Math.min(1, this.appear + dt / FADE)
		this.art.alpha = this.appear
	}

	/** Lays the row out from scratch: cards, glyphs, captions. */
	rebuild(steps: readonly ForecastStep[], minutes: number, animate: boolean): void {
		this.settle()
		for (const card of this.cards) this.destroyCard(card)
		this.cards = []

		this.cards = steps.map((step, index) =>
			this.addCard(step, this.slotX(index), minutes, index === 0)
		)
		this.paintClip()
		this.setScroll(this.scrollPx)

		this.appear = animate ? 0 : 1
		this.art.alpha = this.appear
	}

	/** Starts the leftward roll: cards keep their glyphs, only slots change. */
	roll(steps: readonly ForecastStep[], minutes: number, removed: number): void {
		this.settle()
		const count = this.cards.length
		const kept = this.cards.slice(removed)
		const exiting = this.cards.slice(0, removed)
		const motions: SlotMotion[] = []

		exiting.forEach((card, index) =>
			motions.push({
				card,
				fromX: card.node.x,
				toX: this.slotX(index - removed),
				fromAlpha: 1,
				toAlpha: 0
			})
		)
		kept.forEach((card, index) => {
			if (index === 0) card.weather = steps[index].weather
			// A front pulled in early (a debug pin, a long frame) moves the start of
			// everything behind it; keep the kept captions honest. The clock, and the
			// sky under it, are rewritten together — the card the row keeps must never
			// name a front it is not showing.
			else retimeRailCard(card, steps[index], minutes)
			motions.push({
				card,
				fromX: card.node.x,
				toX: this.slotX(index),
				fromAlpha: 1,
				toAlpha: 1
			})
		})

		const promotion = this.promote(kept[0])

		// The fronts that just appeared in the forecast enter from the right edge,
		// one slot past their own place: the clip hides them until the slide brings
		// them in, so the row reads as one strip moving through a window.
		const entries: RailCard[] = []
		for (let index = 0; index < removed; index += 1) {
			const slot = count - removed + index
			const card = this.addCard(steps[slot], this.slotX(slot) + SLOT, minutes, false)
			card.node.alpha = 0
			motions.push({
				card,
				fromX: this.slotX(slot) + SLOT,
				toX: this.slotX(slot),
				fromAlpha: 0,
				toAlpha: 1
			})
			entries.push(card)
		}

		this.cards = [...kept, ...entries]
		this.slide = { elapsed: 0, motions, promotion, exiting }
	}

	/**
	 * Makes the card that just became «now» change its caption from a clock time
	 * to the live one: the old text stays as a ghost and fades out while the new
	 * one fades in, and the glyph slides to the centre of the new group.
	 */
	private promote(card: RailCard): Promotion {
		const promotion = promoteRailCard(card)
		return { card, ...promotion }
	}

	/** Advances the slide; finishes it by dropping the left-out cards. */
	private step(dt: number): void {
		const slide = this.slide
		if (!slide) return
		slide.elapsed = Math.min(SLIDE_TIME, slide.elapsed + dt)
		const eased = easeOutCubic(slide.elapsed / SLIDE_TIME)

		for (const motion of slide.motions) {
			motion.card.node.x = lerp(motion.fromX, motion.toX, eased)
			motion.card.node.alpha = lerp(motion.fromAlpha, motion.toAlpha, eased)
		}

		if (slide.promotion) {
			const { card, ghost, fromIconX, toIconX } = slide.promotion
			card.icon.x = lerp(fromIconX, toIconX, eased)
			card.label.alpha = eased
			ghost.alpha = 1 - eased
		}

		if (slide.elapsed < SLIDE_TIME) return
		this.finish(slide)
	}

	/** Advances the animated scroll and lands it exactly on the target. */
	private stepScroll(dt: number): void {
		this.scrollElapsed = Math.min(this.scrollTime, this.scrollElapsed + dt)
		const t = this.scrollElapsed / this.scrollTime
		this.scrollPx = lerp(this.scrollFrom, this.scrollToPx, easeOutCubic(t))
		this.art.x = -this.scrollPx
		if (t >= 1) {
			this.scrollPx = this.scrollToPx
			this.art.x = -this.scrollPx
			this.scrollTime = 0
		}
	}

	/** Drops a slide immediately, so a re-layout cannot fight a running one. */
	private settle(): void {
		if (this.slide) this.finish(this.slide)
	}

	/** Applies the final state of `slide` and drops the cards it removed. */
	private finish(slide: Slide): void {
		for (const motion of slide.motions) {
			motion.card.node.x = motion.toX
			motion.card.node.alpha = motion.toAlpha
		}
		for (const card of slide.exiting) this.destroyCard(card)
		if (slide.promotion) {
			const { card, ghost, toIconX } = slide.promotion
			ghost.destroy()
			card.label.alpha = 1
			card.icon.x = toIconX
		}
		this.slide = null
	}

	/** Builds a card at a slot, registers it and returns it. */
	private addCard(step: ForecastStep, x: number, minutes: number, live: boolean): RailCard {
		const card = makeRailCard(step, x, minutes, live)
		this.art.addChild(card.node)
		return card
	}

	/** Fits the clip to the panel's inner face. It never moves with the row. */
	private paintClip(): void {
		this.clip
			.clear()
			.rect(RAIL.pad, RAIL.pad, this.span - RAIL.pad * 2, RAIL.cardHeight)
			.fill(0xffffff)
	}

	/** Left edge of a card slot, in rail coordinates. */
	private slotX(slot: number): number {
		return RAIL.pad + slot * SLOT
	}

	private destroyCard(card: RailCard): void {
		this.cards = this.cards.filter((other) => other !== card)
		card.node.destroy({ children: true })
	}
}
