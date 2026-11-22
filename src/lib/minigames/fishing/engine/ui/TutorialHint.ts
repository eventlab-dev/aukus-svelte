import { Container, Graphics } from 'pixi.js'
import { VIEW } from '../config'
import { RING_PAD } from '../game/castSafety'
import { FIGHT_RADIUS } from '../game/fight'
import { zoneArc, zoneInner, zoneOuter } from '../game/fight/zoneTuning'
import type { GameContext } from '../GameContext'
import type { HelpPageId } from '../texts'
import { tutorialHint } from '../texts'
import { easeOutCubic } from '../utils'
import { UI } from './palette'
import { rectGap, rectHoldsPoint, rectPointGap, rectsOverlap, type UiRect } from './rect'
import { drawCopy } from './richCopy'
import { drawPanel, makeText } from './theme'
import { anchorInk, inkCapCenterY } from './textInk'

/** How long the hint takes to appear and to leave, in seconds. */
const FADE_IN = 0.22
const FADE_OUT = 0.2
/**
 * How long the note holds the round before a press or a key may end it.
 *
 * The player hooks a fish with a button that is still down when the lesson
 * lands; without a beat of quiet the same press would dismiss the text before a
 * single word of it had been read.
 */
export const HINT_HOLD = 0.5
/**
 * The same beat for the dash note, and there is none: zero.
 *
 * That note opens a quarter second into a live dash, when the hand is already
 * on the button and the press *is* the answer to the dash. Any quiet beat there
 * swallowed the counter — the player pressed into the zone and only the note
 * closed. The press that ends this note has to be the press that counters.
 */
export const DASH_HOLD = 0

/** Inset of the frame the hint sits in, in virtual pixels. */
const MARGIN = 12
/**
 * The note's own padding.
 *
 * Panels use `PANEL_PAD`; this one cannot — it is a corner note over a frozen
 * fight, and every pixel it spends on air is a pixel over the water.
 */
const PAD = 8
/**
 * Width of the note, in virtual pixels.
 *
 * Deliberately narrow: the fight stands in the middle of a 480 px frame, and a
 * card this wide already takes the whole strip beside a centred ring. Wider and
 * the note would have nowhere to stand that is not on the water it explains.
 */
const WIDTH = 184
/** Air under the heading before the copy starts. */
const HEAD = 13
/**
 * Air the panel's drop shadow takes on the right and the bottom edge.
 *
 * The note is placed by its footprint, and a card flush against the frame with
 * its shadow cut off by the edge read as a printing mistake.
 */
const SHADOW = 3
/**
 * Step the note is slid along an edge with, in virtual pixels.
 *
 * The note is not snapped to one of the four corners: the corner it used to
 * live in is not free in every water body — the ring follows the cast, and a
 * cast into the near corner of the bay puts the fight exactly where the note
 * was — so its home is the point on the frame's edge with the most air around
 * the fight.
 */
const SLIDE = 4
/**
 * Air the fight's stamina stack takes above the ring, in virtual pixels.
 *
 * The gauge and the срыв bar sit over the circle (see `fightView/BarsView`).
 * The note clears that strip too: the bars are the instrument the lesson tells
 * the player to read, and a note over them explains a scale nobody can see.
 */
const GAUGE_STACK = 28

/**
 * Where the fight is, as the note needs to know it.
 *
 * The note is a corner card over a frozen fight, and the fight is what it has
 * to stay off: the ring, the gauges over it and — while a dash is up — the
 * sector the «КОНТРРЫВОК» lesson exists to point at.
 */
export interface HintZone {
	/** Centre of the fight ring, in scene pixels. */
	x: number
	y: number
	/**
	 * Heading of the dash sector painted on the frozen frame, in radians, or
	 * `null` when no dash is up. The sector outranks every other obstacle: the
	 * whole lesson is "press that one", so covering it explains nothing.
	 */
	sector: number | null
}

/** Everything the note has to be placed around. */
export interface HintLandscape {
	/** The fight, or `null` between fights (the cast lesson stands on open water). */
	zone: HintZone | null
	/**
	 * Rectangles of the round's interface, in scene pixels — the HUD pair, the
	 * touch controls, the travel cards and the weather rail. The note is laid
	 * out to miss them; only when it cannot miss all of them does it cover one.
	 */
	occupied: readonly UiRect[]
}

/** One position of the note: flush to an edge, slid along it. */
interface Home {
	x: number
	y: number
	/** The dash sector is under the card: the one thing that never may be. */
	sectorHit: boolean
	/** The ring or the gauges over it are under the card. */
	zoneHit: boolean
	/** A control or a read-out of the round is under the card. */
	covered: boolean
	/** Air between the card and the nearest painted part of the fight. */
	air: number
}

/** The fight's painted extents: a box to clear and the sector's own outline. */
interface ZoneShape {
	box: UiRect
	sector: readonly { x: number; y: number }[]
}

/** The box the fight paints around its ring: the circle and the gauges over it. */
function zoneShape(zone: HintZone): ZoneShape {
	const reach = FIGHT_RADIUS + RING_PAD
	return {
		box: {
			x: zone.x - reach,
			y: zone.y - reach - GAUGE_STACK,
			width: reach * 2,
			height: reach * 2 + GAUGE_STACK
		},
		sector: zone.sector === null ? [] : sectorOutline(zone, zone.sector)
	}
}

/**
 * Outline of the dash sector, as points around its heading.
 *
 * Read from `zoneTuning` — the same half-angle and the same two radii the model
 * accepts a press in and the view paints — so the note cannot be placed around
 * a sector that is not the one on screen.
 */
function sectorOutline(zone: HintZone, heading: number): { x: number; y: number }[] {
	const arc = zoneArc()
	const points: { x: number; y: number }[] = []
	const at = (angle: number, radius: number): void => {
		points.push({ x: zone.x + Math.cos(angle) * radius, y: zone.y + Math.sin(angle) * radius })
	}
	for (let step = 0; step <= 6; step += 1) at(heading - arc + (2 * arc * step) / 6, zoneOuter())
	for (let step = 0; step <= 4; step += 1) at(heading - arc + (2 * arc * step) / 4, zoneInner())
	return points
}

/** Positions to try, in the order a tie is broken: top edge first, then sides. */
function homes(width: number, height: number): { x: number; y: number }[] {
	const right = Math.max(MARGIN, Math.round(VIEW.width - MARGIN - width))
	const bottom = Math.max(MARGIN, Math.round(VIEW.height - MARGIN - height))
	const across = axis(MARGIN, right)
	const down = axis(MARGIN, bottom)
	return [
		// The top edge first: it is where the note has always stood, so a round
		// with nothing in the fight's corner keeps the layout the player knows.
		...across.map((x) => ({ x, y: MARGIN })),
		...down.map((y) => ({ x: MARGIN, y })),
		...down.map((y) => ({ x: right, y })),
		...across.map((x) => ({ x, y: bottom }))
	]
}

/** Steps a range with {@link SLIDE}, always including its end. */
function axis(from: number, to: number): number[] {
	const values: number[] = []
	for (let value = from; value < to; value += SLIDE) values.push(value)
	values.push(to)
	return values
}

/** Scores one home: what it would cover, and how much air it leaves the fight. */
function rate(
	position: { x: number; y: number },
	width: number,
	height: number,
	shape: ZoneShape | null,
	occupied: readonly UiRect[]
): Home {
	const card = { x: position.x, y: position.y, width, height }
	let air = Infinity
	let zoneHit = false
	let sectorHit = false
	if (shape) {
		zoneHit = rectsOverlap(card, shape.box)
		air = Math.min(air, rectGap(card, shape.box))
		for (const point of shape.sector) {
			if (rectHoldsPoint(card, point.x, point.y)) sectorHit = true
			air = Math.min(air, rectPointGap(card, point.x, point.y))
		}
	}
	const covered = occupied.some((rect) => rectsOverlap(card, rect))
	return { ...position, sectorHit, zoneHit, covered, air }
}

/** True when `a` is the better home: the fight first, the interface second. */
function better(a: Home, b: Home): boolean {
	if (a.sectorHit !== b.sectorHit) return !a.sectorHit
	if (a.zoneHit !== b.zoneHit) return !a.zoneHit
	if (a.covered !== b.covered) return !a.covered
	return a.air > b.air
}

/**
 * Where the note goes: the point on the frame's edge with the most air between
 * the fight and that edge.
 *
 * The note is a corner card and the fight is in the middle of the water, so the
 * free strip is on the side the fight is *not* on: a dash pointing left is
 * answered by a note on the right, and a ring in the near corner of the bay
 * pushes the note to the far one. Placing it by distance to what the fight
 * actually paints — the circle, the gauges, the draft of the sector — keeps the
 * rule honest when an area moves its water or a lesson lands on a different
 * mechanic, instead of baking one corner for one lake.
 */
function placeNote(
	width: number,
	height: number,
	landscape: HintLandscape
): { x: number; y: number } {
	const shape = landscape.zone ? zoneShape(landscape.zone) : null
	let best: Home | null = null
	for (const position of homes(width, height)) {
		const candidate = rate(position, width, height, shape, landscape.occupied)
		if (best === null || better(candidate, best)) best = candidate
	}
	const home = best ?? { x: MARGIN, y: MARGIN }
	return { x: home.x, y: home.y }
}

/**
 * One rule of the manual, as a corner note over a frozen round.
 *
 * The manual used to open as a dialog with a still of the interface, tabs and a
 * close mark, which is fine between rounds and wrong during one: it covered the
 * water, and on a phone it sat on top of the stick. The lesson is now the manual
 * page itself — heading and rules, word for word — laid out in the strip of the
 * frame the fight is not using, with no dimmer, so the frozen picture behind it
 * stays the illustration.
 *
 * It closes itself: the first press or key after {@link HINT_HOLD} dismisses it
 * and also counts as the action it was, so the player never spends an input on
 * OK. The owner resumes the round at that same moment.
 */
export class TutorialHint extends Container {
	private readonly card = new Container()
	private readonly onClose: () => void
	private intro = 0
	private closing = false
	private outro = 0
	private held = 0
	/** Quiet beat this note holds the round for; see `HINT_HOLD` / `DASH_HOLD`. */
	private readonly hold: number
	/** Top edge of the note's home, so the fades rise from where it stands. */
	private readonly homeY: number

	constructor(
		game: GameContext,
		lesson: HelpPageId,
		hold: number,
		landscape: HintLandscape,
		onClose: () => void
	) {
		super()
		this.onClose = onClose
		this.hold = hold
		const page = tutorialHint(game.touch, lesson)
		// The manual's copy, a step down in size: this note has to read as a corner
		// label over the frozen water, not as a window.
		const size = game.ui.pick(7, 9)
		const lineHeight = game.ui.pick(9, 12)

		// The bullets are the card's height: the note stays a corner card instead
		// of a panel the size of the frame, whatever the lesson's length.
		const copyX = PAD
		const copyWidth = WIDTH - PAD * 2
		const rows = new Container()
		let copyHeight = 0
		const rowTops: number[] = []
		for (const line of page.lines) {
			rowTops.push(copyHeight)
			copyHeight +=
				drawCopy(rows, line, {
					x: copyX,
					y: PAD + HEAD + copyHeight,
					width: copyWidth - 10,
					size,
					lineHeight
				}) + 2
		}
		const height = PAD * 2 + HEAD + copyHeight

		const panel = new Graphics()
		drawPanel(panel, 0, 0, WIDTH, height, { fill: UI.panel, alpha: 0.92, shadow: true })
		this.card.addChild(panel)

		const heading = makeText(page.title, {
			size: game.ui.font(8),
			weight: 800,
			color: UI.text,
			letterSpacing: 0.5
		})
		anchorInk(heading, 'left', 'center')
		heading.position.set(copyX, PAD + 5)
		this.card.addChild(heading)

		// The rule under the heading, in the same periwinkle hairline the manual
		// uses to separate a lesson from its title.
		panel.rect(copyX, PAD + 11, copyWidth, 1).fill({ color: UI.periwinkle, alpha: 0.4 })

		// The bullets are laid out before the copy is measured, so the marker of
		// each row can sit on the capitals of its first line.
		const probe = makeText('', { size, lineHeight })
		const capCentre = inkCapCenterY(probe)
		probe.destroy()
		for (const top of rowTops) {
			panel.rect(copyX, Math.round(PAD + HEAD + top + capCentre - 1.5), 3, 3).fill(UI.periwinkle)
		}
		this.card.addChild(rows)

		const home = placeNote(WIDTH + SHADOW, height + SHADOW, landscape)
		this.homeY = home.y
		this.addChild(this.card)
		this.card.position.set(home.x, home.y)
		this.card.alpha = 0
		this.card.y = home.y - 4
	}

	/** True once the note may be dismissed by the next press or key. */
	get canDismiss(): boolean {
		return !this.closing && this.held >= this.hold
	}

	/** True while the note is already on its way out. */
	get isClosing(): boolean {
		return this.closing
	}

	/** Starts the fade; the owner keeps ticking until `update` reports the end. */
	beginClose(): void {
		if (this.closing) return
		this.closing = true
		this.outro = 0
	}

	/**
	 * Advances the fade in, or the fade out once {@link beginClose} was called.
	 * Returns true once the note has fully left the frame.
	 */
	update(dt: number): boolean {
		if (this.closing) {
			this.outro = Math.min(1, this.outro + dt / FADE_OUT)
			const eased = easeOutCubic(this.outro)
			this.card.alpha = 1 - eased
			this.card.y = this.homeY - 6 * eased
			if (this.outro >= 1) {
				this.onClose()
				return true
			}
			return false
		}
		// The quiet beat is counted on the note's own clock: it runs while the round
		// is frozen, and it is the only thing that lets a press through.
		if (this.held < this.hold) this.held = Math.min(this.hold, this.held + dt)
		if (this.intro >= 1) return false
		this.intro = Math.min(1, this.intro + dt / FADE_IN)
		const eased = easeOutCubic(this.intro)
		this.card.alpha = eased
		this.card.y = this.homeY - 4 * (1 - eased)
		return false
	}
}
