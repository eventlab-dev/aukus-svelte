import { Container, Graphics, Rectangle, Sprite } from 'pixi.js'
import type { GameContext } from '../GameContext'
import { AREAS, type AreaDef } from '../areas'
import { VIEW } from '../config'
import { CURSORS } from '../cursors'
import { TEXT } from '../texts'
import type { AreaId, WeatherId } from '../types'
import type { WipePoint } from './GridWipe'
import { easeOutCubic, lerp } from '../utils'
import { UI } from './palette'
import { drawLockMark } from './lockMark'
import type { UiRect } from './rect'
import { drawPanel, drawWeatherIcon, makeText } from './theme'
import { anchorInk } from './textInk'
import { TapGuard } from './tapSlop'

/** One travel card in the bottom corner. */
export const TRAVEL_CARD = { width: 68, height: 40 } as const
/** Inset of the cards from the frame edge; matches the HUD's corner cards. */
export const TRAVEL_MARGIN = 8
/** Height of the name strip along the bottom of a card. */
const FOOTER = 11
/** Inner gutter of the thumbnail against the frame. */
const THUMB_PAD = 2
/** Side of the weather badge in the thumbnail's top-right corner. */
const WEATHER_BADGE = 14
/** Distance a card travels while sliding into its corner, in pixels. */
const SLIDE = 26
/** How long that slide takes, in seconds. */
const SLIDE_TIME = 0.3
/** Dimming of a card whose water body the host keeps closed. */
const LOCKED_ALPHA = 0.8

/**
 * Two travel cards in the bottom corners: the water bodies either side of the
 * one being fished, one per corner, showing a real still of each.
 *
 * The pair is a carousel, not "the other two in table order": the left card is
 * the water body before the current one in {@link AREAS} and the right card the
 * one after, wrapping around. Clicking the right card therefore walks the ring
 * forward (the lake you leave slides into the left corner and the next water
 * body appears on the right), and clicking the left card walks it back. Under
 * the old table order the two cards simply swapped names: from the lake, two
 * clicks to the right bounced between two water bodies and the third was never
 * reachable that way.
 *
 * A water body the host closed still gets its corner — the player has to see
 * that the place exists, or the world looks like it has two lakes — but the
 * card is sealed: no still, a padlock where the sky would be, and no way out.
 */
export class AreaShortcuts extends Container {
	private readonly cards: ShortcutCard[] = []
	/** Cards sliding into their corners, with the x each one started from. */
	private readonly arrivals: Array<{
		card: ShortcutCard
		fromX: number
		targetX: number
	}> = []
	private elapsed = 0

	constructor(
		game: GameContext,
		current: AreaId,
		onPick: (areaId: AreaId, origin: WipePoint) => void
	) {
		super()
		const count = AREAS.length
		const index = Math.max(
			0,
			AREAS.findIndex((area) => area.id === current)
		)
		// Around the ring in the direction the cards read left to right.
		const neighbours = [AREAS[(index + count - 1) % count], AREAS[(index + 1) % count]]
		neighbours.forEach((area, side) => {
			const card = new ShortcutCard(game, area, () =>
				// The wipe starts where the click landed: the card's own centre, so the
				// grid opens from that corner instead of as a wall from the frame edge.
				onPick(area.id, {
					x: card.x + TRAVEL_CARD.width / 2,
					y: card.y + TRAVEL_CARD.height / 2
				})
			)
			// First neighbour on the left, second on the right: the ring order is
			// fixed by `AREAS`, so the corners never swap under the player's hand.
			const targetX = side === 0 ? TRAVEL_MARGIN : VIEW.width - TRAVEL_MARGIN - TRAVEL_CARD.width
			const fromX = targetX + (side === 0 ? -SLIDE : SLIDE)
			card.position.set(fromX, VIEW.height - TRAVEL_MARGIN - TRAVEL_CARD.height)
			card.alpha = 0
			this.addChild(card)
			this.cards.push(card)
			this.arrivals.push({ card, fromX, targetX })
		})
	}

	/**
	 * Slides the pair into place. The cards arrive from the sides they belong to,
	 * so a switch reads as the ring turning rather than as two thumbnails being
	 * swapped behind a fade.
	 */
	update(dt: number): void {
		for (const card of this.cards) card.update()
		if (this.elapsed >= SLIDE_TIME) return
		this.elapsed = Math.min(SLIDE_TIME, this.elapsed + dt)
		const t = this.elapsed / SLIDE_TIME
		const eased = easeOutCubic(t)
		for (const arrival of this.arrivals) {
			arrival.card.x = lerp(arrival.fromX, arrival.targetX, eased)
			// The arrival must not launder a sealed card into a normal one: its own
			// dimming multiplies the slide's fade instead of being overwritten by it.
			arrival.card.alpha = eased * (arrival.card.locked ? LOCKED_ALPHA : 1)
		}
	}

	/** True when the point is on one of the cards, for the cast cursor. */
	hitTest(x: number, y: number): boolean {
		return this.cards.some((card) => card.hitTest(x, y))
	}

	/**
	 * Rects of the two cards, in scene pixels.
	 *
	 * The lesson note is laid out around the interface, and the corners are the
	 * cards' own: a note over one hides the door to the next water body while it
	 * explains the water the player is standing on.
	 */
	reservedRects(): UiRect[] {
		return this.cards.map((card) => ({
			x: card.x,
			y: card.y,
			width: TRAVEL_CARD.width,
			height: TRAVEL_CARD.height
		}))
	}

	/**
	 * Dims and disables the cards. A fight is a one-mistake window right under
	 * the player's hand, and a corner card that jumps to another lake would end
	 * the round on a stray click.
	 */
	setAvailable(available: boolean): void {
		for (const card of this.cards) card.setAvailable(available)
	}
}

/** A single travel card: a still of the water body with its name on a strip. */
class ShortcutCard extends Container {
	private readonly game: GameContext
	private readonly areaId: AreaId
	/** True while the host keeps this water body closed. */
	readonly locked: boolean
	private readonly hoverLayer = new Graphics()
	private readonly weatherPlate = new Graphics()
	private readonly weatherArt = new Graphics()
	private readonly tap = new TapGuard()
	private weather: WeatherId | null = null
	private available = true

	constructor(game: GameContext, area: AreaDef, onClick: () => void) {
		super()
		this.game = game
		this.areaId = area.id
		this.locked = game.isAreaLocked(area.id)
		const texture = game.previewFor(area.id)
		const label = this.locked ? TEXT.areas.closed : area.name

		const frame = new Graphics()
		drawPanel(frame, 0, 0, TRAVEL_CARD.width, TRAVEL_CARD.height, {
			fill: UI.panel,
			alpha: 0.92,
			shadow: true
		})
		this.addChild(frame)

		// The preview is a full 480×270 still, cropped to the card: the card is
		// wider than it is tall, so the still is scaled to cover and the mask takes
		// the middle band, which is the water the player recognises.
		const viewWidth = TRAVEL_CARD.width - THUMB_PAD * 2
		const viewHeight = TRAVEL_CARD.height - FOOTER - THUMB_PAD
		if (this.locked) {
			this.paintSealedThumb(viewWidth, viewHeight)
		} else {
			const thumb = new Sprite(texture)
			const scale = Math.max(
				viewWidth / Math.max(1, texture.width),
				viewHeight / Math.max(1, texture.height)
			)
			thumb.scale.set(scale)
			thumb.position.set(
				THUMB_PAD + viewWidth / 2 - (texture.width * scale) / 2,
				THUMB_PAD + viewHeight / 2 - (texture.height * scale) / 2
			)
			this.addChild(thumb)

			const mask = new Graphics()
			mask.rect(THUMB_PAD, THUMB_PAD, viewWidth, viewHeight).fill(0xffffff)
			this.addChild(mask)
			thumb.mask = mask
		}

		// Weather badge in the top-right corner: one square of the front's own
		// colour with the dark glyph inside, the same frame size for every front.
		// The old full-width band hid a third of the still and its label had to be
		// read; a corner badge says the same thing without covering the picture.
		//
		// A closed location has no forecast at all: the badge is not drawn, so the
		// card carries no sky, no weather and no promise of one.
		if (!this.locked) {
			const badgeX = TRAVEL_CARD.width - THUMB_PAD - WEATHER_BADGE - 2
			const badgeY = THUMB_PAD + 2
			this.weatherPlate.position.set(badgeX, badgeY)
			this.addChild(this.weatherPlate)
			this.weatherArt.position.set(badgeX + 2, badgeY + 2)
			this.weatherArt.scale.set(0.83)
			this.addChild(this.weatherArt)
		}

		// Name strip: the label has to stay readable over bright snow, so it gets
		// its own dark band instead of sitting straight on the still.
		const footer = new Graphics()
		footer
			.rect(THUMB_PAD, TRAVEL_CARD.height - FOOTER - THUMB_PAD, viewWidth, FOOTER)
			.fill({ color: UI.ink, alpha: 0.82 })
		this.addChild(footer)

		const name = makeText(label, {
			size: 5.5,
			weight: 800,
			color: this.locked ? UI.textMuted : UI.text,
			align: 'center',
			letterSpacing: 0.2
		})
		anchorInk(name, 'center')
		name.position.set(TRAVEL_CARD.width / 2, TRAVEL_CARD.height - FOOTER / 2 - THUMB_PAD)
		this.addChild(name)

		this.hoverLayer.visible = false
		this.addChild(this.hoverLayer)

		this.eventMode = 'static'
		this.cursor = CURSORS.pointer
		this.hitArea = new Rectangle(0, 0, TRAVEL_CARD.width, TRAVEL_CARD.height)
		this.on('pointerover', (event) => {
			// No hover on a finger: the frame lights while the press is down instead.
			if (!this.available || event.pointerType === 'touch') return
			this.game.audio.hover()
			this.setHovered(true)
		})
		this.on('pointerdown', (event) => {
			this.tap.start(event.global.x, event.global.y)
			if (!this.available || event.pointerType !== 'touch') return
			// The ring is the press feedback here; the cue belongs to the click, and
			// playing the hover one first made every tap sound like two taps.
			this.setHovered(true)
		})
		this.on('pointerup', (event) => {
			if (event.pointerType === 'touch') this.setHovered(false)
		})
		this.on('pointerout', () => this.setHovered(false))
		this.on('pointertap', (event) => {
			if (!this.available) return
			// The card is 68×40: a thumb that crossed it on the way to the water used
			// to change the lake instead of casting.
			if (!this.tap.end(event.global.x, event.global.y)) return
			this.game.audio.click()
			onClick()
		})
		this.update()
		// A card for water the host keeps closed is never a way out of the round:
		// it shows the door, sealed, instead of the sky over that shore.
		if (this.locked) {
			this.available = false
			this.alpha = LOCKED_ALPHA
			this.eventMode = 'none'
			this.cursor = CURSORS.default
		}
	}

	/**
	 * The still of a closed location is replaced by a sealed plate: a dark field
	 * with a woven dither and one padlock. The player still sees that the corner
	 * is a place, but nothing of the water it hides.
	 */
	private paintSealedThumb(viewWidth: number, viewHeight: number): void {
		const plate = new Graphics()
		plate.rect(THUMB_PAD, THUMB_PAD, viewWidth, viewHeight).fill({ color: UI.ink, alpha: 0.94 })
		for (let row = 0; row < viewHeight; row += 3) {
			const offset = (row / 3) % 2 === 0 ? 0 : 2
			for (let col = offset; col < viewWidth; col += 5) {
				plate
					.rect(THUMB_PAD + col, THUMB_PAD + row, 2, 1)
					.fill({ color: UI.periwinkle, alpha: 0.14 })
			}
		}
		const scale = 2
		const lockWidth = 7 * scale
		const lockHeight = 9 * scale
		drawLockMark(
			plate,
			Math.round(THUMB_PAD + (viewWidth - lockWidth) / 2),
			Math.round(THUMB_PAD + (viewHeight - lockHeight) / 2),
			scale,
			UI.periwinkle,
			UI.ink
		)
		this.addChild(plate)
	}

	/** Keeps the weather badge in step with the sky over that water body. */
	update(): void {
		// Nothing to keep in step: a closed location has no badge to fill.
		if (this.locked) return
		const weather = this.game.clock.weatherFor(this.areaId)
		if (weather === this.weather) return
		this.weather = weather
		this.weatherPlate.clear()
		this.weatherPlate.rect(0, 0, WEATHER_BADGE, WEATHER_BADGE).fill({ color: UI.ink, alpha: 0.85 })
		this.weatherPlate
			.rect(0, 0, WEATHER_BADGE, WEATHER_BADGE)
			.stroke({ width: 1, color: UI.panel, alpha: 0.9 })
		// The glyph keeps the front's colour, exactly like the picker's weather
		// row: a dark plate behind it is what makes that colour readable over the
		// bright snow of the still.
		this.weatherArt.clear()
		drawWeatherIcon(this.weatherArt, weather)
	}

	hitTest(x: number, y: number): boolean {
		return (
			this.visible &&
			x >= this.x &&
			x <= this.x + TRAVEL_CARD.width &&
			y >= this.y &&
			y <= this.y + TRAVEL_CARD.height
		)
	}

	setAvailable(available: boolean): void {
		// A closed location stays closed whatever the round is doing: the fight
		// dimming and the host's lock are two different reasons to refuse a click.
		const next = available && !this.locked
		if (this.available === next) return
		this.available = next
		this.alpha = next ? 1 : this.locked ? LOCKED_ALPHA : 0.4
		this.eventMode = next ? 'static' : 'none'
		this.cursor = next ? CURSORS.pointer : CURSORS.default
		if (!next) this.setHovered(false)
	}

	private setHovered(hovered: boolean): void {
		this.hoverLayer.visible = hovered
		if (!hovered) return
		const g = this.hoverLayer
		g.clear()
		g.rect(0, 0, TRAVEL_CARD.width, TRAVEL_CARD.height).stroke({
			width: 1,
			color: UI.primary,
			alignment: 0.5
		})
	}
}
