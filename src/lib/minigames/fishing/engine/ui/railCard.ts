import { Container, Graphics, Text } from 'pixi.js'
import { currentFontScale } from '../fonts'
import { TEXT, WEATHER_LABEL } from '../texts'
import type { WeatherId } from '../types'
import { formatClock } from '../utils'
import { mixColor, type ForecastStep } from '../world'
import { UI } from './palette'
import { drawWeatherIcon, makeText, setText, WEATHER_TINT } from './theme'
import { anchorInk, inkWidth, realignInk } from './textInk'
import { RAIL } from './weatherRailLayout'

/**
 * One card of the weather rail: its sunken well, its glyph and its two captions.
 *
 * The card owns everything that is drawn; the rail owns the row and the motion
 * of it, and only moves the card's node around. Splitting the two keeps the
 * animation code from carrying the typography, and lets a card be rebuilt on its
 * own without touching the slide that may be running beside it.
 */
export interface RailCard {
	weather: WeatherId
	/** The period the player is standing in: live caption instead of a clock. */
	live: boolean
	node: Container
	well: Graphics
	icon: Graphics
	/** Clock time, or «СЕЙЧАС» while this period is the live one. */
	label: Text
	/** Name of the sky, under the clock. */
	name: Text
}

/**
 * Caption sizes, in virtual pixels. A card carries two lines: the clock — or
 * «СЕЙЧАС» for the period in progress — over the name of its sky. The clock
 * keeps the size it always had, the name is a notch smaller so it reads as the
 * clock's subtitle instead of a second headline on the same card.
 */
const TIME_SIZE = 5.5
const NAME_SIZE = 4.5
/**
 * The live caption is set a hair below the clock's own size.
 *
 * «СЕЙЧАС» is six capitals against the clock's five digits, and capitals sit
 * taller in this font than figures: at the clock's size the live card was the
 * one card in the row that shouted. A couple of tenths of a pixel smaller lands
 * its cap height on the digits beside it.
 */
const LIVE_SIZE = 4.8
/** Top of each line's capitals, measured from the card's own top edge. */
const TIME_TOP = 3
const NAME_TOP = 9

/** Builds one card for the slot starting at `x`, placed and painted. */
export function makeRailCard(
	period: ForecastStep,
	x: number,
	minutes: number,
	live: boolean,
	fromX?: number
): RailCard {
	const node = new Container()
	const well = new Graphics()
	const icon = new Graphics()
	// The glyph keeps the front's own colour, like the corner travel badges: a
	// coloured icon on the dark card reads at a glance and never fights the text.
	// It is the same 12 px glyph the travel cards and the picker draw: the rail
	// used to carry a shrunk sun, and next to the badges it read as a different
	// icon for the same sky.
	drawWeatherIcon(icon, period.weather, WEATHER_TINT[period.weather])
	const label = makeText(live ? TEXT.forecast.now : formatClock(minutes + period.startsIn / 60), {
		size: live ? LIVE_SIZE : TIME_SIZE,
		weight: 800,
		// The live caption is muted like the clock times beside it: the glyph's
		// colour and the row's order already say which card is «now».
		color: UI.textMuted,
		letterSpacing: 0.2
	})
	anchorInk(label, 'left', 'top')
	label.y = TIME_TOP
	// The name of the front, under its clock. It is drawn from the same data as
	// the glyphs, so a card can never name a sky it does not show.
	const name = makeText(WEATHER_LABEL[period.weather], {
		size: NAME_SIZE,
		weight: 700,
		color: UI.periwinkleLight,
		// No tracking: «СНЕГОПАД» is eight capitals in a 42 px card, and the 0.2 px
		// a letter would add pushed its last glyph past the well's right edge.
		letterSpacing: 0,
		alpha: 0.9
	})
	anchorInk(name, 'left', 'top')
	name.y = NAME_TOP
	node.position.set(fromX ?? x, RAIL.pad)
	node.addChild(well, icon, label, name)

	const card: RailCard = {
		weather: period.weather,
		live,
		node,
		well,
		icon,
		label,
		name
	}
	placeRailCard(card)
	paintRailCard(card)
	return card
}

/**
 * Centres the glyph and the two-line caption block on the card.
 *
 * The block is measured by its ink, not by the advance box: the pixel font
 * leaves several empty pixels after the last glyph, and centring on the box
 * pushed every card's text a little to the left of its glyph.
 */
export function placeRailCard(card: RailCard): void {
	const textW = Math.max(inkWidth(card.label), inkWidth(card.name))
	const group = RAIL.icon + RAIL.labelGap + textW
	const iconX = Math.round((RAIL.cardWidth - group) / 2)
	card.icon.position.set(iconX, Math.round((RAIL.cardHeight - RAIL.icon) / 2))
	const textX = iconX + RAIL.icon + RAIL.labelGap
	card.label.x = textX
	card.name.x = textX
}

/**
 * Paints one card's well. Every card is the same sunken indigo: the live period
 * is told apart by its live caption and its coloured glyph, not by a raised
 * surface.
 */
export function paintRailCard(card: RailCard): void {
	card.well
		.clear()
		.rect(0, 0, RAIL.cardWidth, RAIL.cardHeight)
		.fill(mixColor(UI.panel, UI.ink, 0.33))
}

/**
 * Rewrites a kept card when the schedule behind it moved: the clock, and the sky
 * itself if the period that landed on this slot is a different one.
 */
export function retimeRailCard(card: RailCard, period: ForecastStep, minutes: number): void {
	if (card.weather !== period.weather) {
		card.weather = period.weather
		drawWeatherIcon(card.icon, period.weather, WEATHER_TINT[period.weather])
		setText(card.name, WEATHER_LABEL[period.weather])
	}
	const text = formatClock(minutes + period.startsIn / 60)
	if (card.label.text !== text) {
		card.label.text = text
		realignInk(card.label)
	}
	placeRailCard(card)
}

/** Pieces the rail needs to crossfade a card that just became «now». */
export interface CardPromotion {
	/** The old clock caption, fading out over the new one. */
	ghost: Text
	/** Glyph x before and after the group is re-centred on the live caption. */
	fromIconX: number
	toIconX: number
}

/**
 * Turns a card into the live one: its clock crossfades into «СЕЙЧАС», set a
 * notch smaller so its caps line up with the digits of the cards beside it.
 */
export function promoteRailCard(card: RailCard): CardPromotion {
	// The ghost keeps the clock at the clock's own size: only the word changes.
	const ghost = makeText(card.label.text, {
		size: TIME_SIZE,
		weight: 800,
		color: UI.textMuted,
		letterSpacing: 0.2
	})
	anchorInk(ghost, 'left', 'top')
	ghost.position.copyFrom(card.label.position)
	card.node.addChild(ghost)

	const fromIconX = card.icon.x
	card.live = true
	card.label.text = TEXT.forecast.now
	card.label.style.fontSize = LIVE_SIZE * currentFontScale()
	// Re-aiming is not optional here: both anchors are measured from the style,
	// so a new size leaves them pointing at the old line box.
	anchorInk(card.label, 'left', 'top')
	placeRailCard(card)
	const toIconX = card.icon.x

	card.icon.x = fromIconX
	card.label.alpha = 0
	return { ghost, fromIconX, toIconX }
}
