import { Container, Graphics, Rectangle, Sprite, Text, Circle, type Texture } from 'pixi.js'
import { VIEW } from '../../config'
import { TEXT } from '../../texts'
import { STICK_GRAB_SLACK, zoneArc } from '../../game/fight/zoneTuning'
import { easeOutCubic, lerp } from '../../utils'
import { TRAVEL_CARD, TRAVEL_MARGIN } from '../AreaShortcuts'
import { GrabGesture } from './grabGesture'
import { UI } from '../palette'
import type { UiRect } from '../rect'
import { anchorInk } from '../textInk'
import { drawPanel, drawPanelFrame, makeText } from '../theme'

/**
 * The touch controls of a round: a stick under the left thumb and one chip
 * under the right one.
 *
 * The chip is a single control with two jobs, because the two never happen at
 * the same time: it shows a rod and the water's own float between casts and a
 * fish in a fight, so the cast needs no prompt over the water and no second
 * target. It also has two homes, one above the travel card and one on the
 * stick's line (see {@link CHIP_CAST} and {@link CHIP_FIGHT}).
 *
 * The stick exists while a fish is on the line: the ring, the float with its
 * escape arc and the counter sector all live around the middle of the frame,
 * and they used to live *under the finger* that steered. The stick keeps that
 * hand in the corner, so the fight is watched instead of played blind.
 *
 * There is no strike button either: the strike is the stick's own press. A chip
 * would be one more target to find in a half-second window, and the stick is
 * already under the thumb that has to answer — so the bite is announced on the
 * stick (an amber ring and a caption) and pressing it hooks the fish.
 */

/** The stick: centre of its base, radius of the base and of the knob. */
const STICK = { x: 62, y: 200, base: 45, knob: 18 } as const
/** Radius around the base that still takes the press, in pixels. */
const STICK_HIT = 62
/** Deflection below which the stick is considered idle. */
const DEAD_ZONE = 0.2
/** Ring drawn around the pad while the bite asks to be struck. */
const HOOK_RING = STICK.base + 3
/** Caption under the pad during the bite. */
const HOOK_LABEL_Y = STICK.base + 14

/**
 * The chip on the right: cast between rounds, landing inside one.
 *
 * It has two homes, both in the right-hand corner. Between casts it sits
 * directly above the travel card — the card's still is the mini-preview of the
 * water body the throw goes into, so the two read as one column of the corner —
 * and in a round it steps down to the stick's own centre line, because the pad
 * and the chip are the two halves of the round's control and a pair that does
 * not line up is the first thing the eye catches. The chip slides between the
 * two instead of blinking there: the jump landed exactly when the cast left the
 * rod, which read as a second, phantom press.
 */
const CHIP = { width: 64, height: 64 } as const
/** Air between the chip's bottom edge and the travel card's top one. */
const CHIP_GAP = 6
/** Between casts: centred on the travel card, the corner's mini-preview. */
const CHIP_CAST = {
	x: VIEW.width - TRAVEL_MARGIN - TRAVEL_CARD.width / 2 - CHIP.width / 2,
	y: VIEW.height - TRAVEL_MARGIN - TRAVEL_CARD.height - CHIP_GAP - CHIP.height
} as const
/** In a round: the same column, centred on the stick. */
const CHIP_FIGHT = {
	x: CHIP_CAST.x,
	y: STICK.y - CHIP.height / 2
} as const
/** How long the chip takes to move between its two homes, in seconds. */
const CHIP_SLIDE = 0.16
/**
 * Icon box of the chip is 16 px, drawn at this magnification.
 *
 * 2.5, not 3: the sheets are drawn to the very edge of their 16 px cell, while
 * the marks this replaced left a pixel of air around themselves. At 3× the rod
 * filled the plate edge to edge and read as a picture pasted on the button; at
 * 2.5× (40 px on a 64 px chip) it sits in the plate the way a mark should.
 */
const CHIP_ICON_SCALE = 2.5
/** Radians per second of the two pulses (bite ring and chip glow). */
const PULSE_RATE = 5

/** What the right chip does right now. */
export type ChipAction = 'cast' | 'land' | null

/**
 * One of the chip's two marks, as a sprite from the project's own 16 px sheets:
 * the rod with its line and float for the cast, the bare hook for the catch.
 *
 * The marks used to be drawn here by hand — a rod, a bobber and a fish in the
 * interface's ink — so one painter could tint them with the chip's state. The
 * sheets are pixel art in their own colours, which is what the buttons wanted:
 * the rod and the hook are the two objects the player is holding, not two more
 * glyphs in the interface's line. State is carried by the plate and by alpha
 * (see {@link drawChip}), so the marks never need recolouring: the rod on the
 * dark chip and the hook on the lit one are the same sprite.
 */
function chipMark(texture: Texture): Sprite {
	const mark = new Sprite(texture)
	mark.anchor.set(0, 0)
	mark.scale.set(CHIP_ICON_SCALE)
	mark.position.set(
		(CHIP.width - 16 * CHIP_ICON_SCALE) / 2,
		(CHIP.height - 16 * CHIP_ICON_SCALE) / 2
	)
	mark.eventMode = 'none'
	return mark
}

/**
 * What the group shows: `idle` is the chip alone (the stick belongs to a fish
 * on the line), `round` is both, `hidden` is neither.
 */
export type ControlsMode = 'idle' | 'round' | 'hidden'

export interface FightControlsHandlers {
	/** The stick went down (pull) or came back up (rest). Also the strike. */
	onHold(held: boolean): void
	/** Normalized pull direction; zero when the stick is centred and idle. */
	onDirection(x: number, y: number): void
	/** The stick was pushed into the counter sector and pulled back: grab it. */
	onGrab(angle: number): void
	/** The chip went down (charging a cast) or came up (the cast leaves). */
	onCastHold(held: boolean): void
	/** The fish is on the landing threshold and the chip was tapped. */
	onLand(): void
}

/** The two 16 px marks of the chip, owned by the asset bag. */
export interface ChipMarks {
	/** Rod with its line and float: the cast. */
	rod: Texture
	/** Bare hook: the catch. */
	hook: Texture
}

/**
 * Stick + chip, drawn in the interface's own pixel language.
 *
 * The stick carries three readings of its own: the knob shows where the pull is
 * aimed, a wedge mirrors the counter sector while a dash is live, and the whole
 * pad lights amber with a «ПОДСЕЧКА» caption for the bite.
 */
export class FightControls extends Container {
	private readonly stick = new Container()
	private readonly stickBase = new Graphics()
	private readonly stickCue = new Graphics()
	private readonly stickHook = new Graphics()
	private readonly knob = new Graphics()
	private readonly hookLabel: Text

	private readonly chip = new Container()
	private readonly chipPanel = new Graphics()
	private readonly chipGlow = new Graphics()
	/** The rod, for a cast; the hook, once the catch is possible. */
	private readonly castMark: Sprite
	private readonly landMark: Sprite

	private readonly handlers: FightControlsHandlers

	/** Pointer that owns the stick; null while nobody holds it. */
	private pointerId: number | null = null
	private vectorX = 0
	private vectorY = 0
	/** Last direction the thumb actually pointed, kept while it rests. */
	private lastX = 0
	private lastY = 0
	/** Direction of the counter sector while a dash is live, in radians. */
	private cueAngle: number | null = null
	/** The counter gesture's state (see `grabGesture.ts`). */
	private readonly grab = new GrabGesture()
	/** Chip home the slide started in, and the one it is heading to. */
	private chipFromX = CHIP_CAST.x
	private chipFromY = CHIP_CAST.y
	private chipToX = CHIP_CAST.x
	private chipToY = CHIP_CAST.y
	/** Progress of that slide, 0..1; 1 means the chip is home. */
	private chipSlide = 1
	private hookReady = false
	private action: ChipAction = null
	private mode: ControlsMode = 'hidden'
	private time = 0

	constructor(handlers: FightControlsHandlers, marks: ChipMarks) {
		super()
		this.handlers = handlers
		// `passive`, not `none`: in Pixi `none` shuts the children down with the
		// parent, and the stick and the chip are children. The container itself has
		// no hit area, so only they take presses.
		this.eventMode = 'passive'
		this.visible = false

		this.stick.position.set(STICK.x, STICK.y)
		this.stick.eventMode = 'static'
		this.stick.hitArea = new Circle(0, 0, STICK_HIT)
		this.stick.addChild(this.stickBase, this.stickHook, this.stickCue, this.knob)
		this.addChild(this.stick)

		this.hookLabel = makeText(TEXT.game.hook, {
			size: 10,
			weight: 800,
			color: UI.amber,
			align: 'center',
			letterSpacing: 0.6
		})
		anchorInk(this.hookLabel, 'center', 'top')
		this.hookLabel.position.set(0, HOOK_LABEL_Y)
		this.hookLabel.visible = false
		this.stick.addChild(this.hookLabel)

		this.chip.position.set(CHIP_CAST.x, CHIP_CAST.y)
		this.chip.eventMode = 'none'
		this.chip.hitArea = new Rectangle(0, 0, CHIP.width, CHIP.height)
		this.castMark = chipMark(marks.rod)
		this.landMark = chipMark(marks.hook)
		this.landMark.visible = false
		this.chip.addChild(this.chipPanel, this.chipGlow, this.castMark, this.landMark)
		this.addChild(this.chip)

		this.bindStick()
		this.bindChip()
		this.drawStick()
		this.drawKnob()
		this.drawChip()
	}

	// ------------------------------------------------------------------- stick

	private bindStick(): void {
		const press = (event: { pointerId: number }): void => {
			if (this.pointerId !== null) return
			this.pointerId = event.pointerId
			this.handlers.onHold(true)
		}
		this.stick.on('pointerdown', (event) => {
			press(event)
			this.moveStick(event.getLocalPosition(this.stick))
		})
		// The stick keeps following the thumb outside its own pad, so a pull can
		// run past the rim without the knob sticking and the direction snapping.
		this.stick.on('globalpointermove', (event) => {
			if (event.pointerId !== this.pointerId) return
			this.moveStick(event.getLocalPosition(this.stick))
		})
		const release = (event: { pointerId: number }): void => {
			if (event.pointerId !== this.pointerId) return
			this.releaseStick()
		}
		this.stick.on('pointerup', release)
		this.stick.on('pointerupoutside', release)
		this.stick.on('pointercancel', release)
	}

	/** Places the knob for a local point and derives the pull vector from it. */
	private moveStick(local: { x: number; y: number }): void {
		const length = Math.hypot(local.x, local.y)
		const unitX = length > 0.001 ? local.x / length : this.lastX
		const unitY = length > 0.001 ? local.y / length : this.lastY
		// The knob rides inside the pad.
		const reach = Math.min(length, STICK.base - STICK.knob)
		this.knob.position.set(unitX * reach, unitY * reach)

		const magnitude = reach / STICK.base
		if (magnitude >= DEAD_ZONE) {
			this.lastX = unitX
			this.lastY = unitY
		}
		// The direction sticks while the thumb rests: a centred stick that reported
		// nothing would hand the pull back to a stale pointer, and the model's own
		// fallback is "straight to the centre of the ring" — which brakes every
		// dash the fish makes. Keeping the last direction is how the mouse behaves
		// (it drags the fish toward the cursor and keeps doing it while the button
		// is down), so the two controls steer the same fight.
		this.vectorX = this.lastX
		this.vectorY = this.lastY
		this.handlers.onDirection(this.vectorX, this.vectorY)
		this.checkGrab(magnitude, Math.atan2(unitY, unitX))
	}

	/**
	 * Reads the counter gesture: point into the sector, then pull back.
	 *
	 * The rule itself lives in `grabGesture.ts`; this only feeds it the stick's
	 * deflection and turns the answer into one counter attempt.
	 */
	private checkGrab(magnitude: number, angle: number): void {
		if (this.grab.update(magnitude, angle, this.cueAngle)) {
			this.handlers.onGrab(angle)
		}
	}

	private releaseStick(): void {
		this.pointerId = null
		this.vectorX = 0
		this.vectorY = 0
		this.lastX = 0
		this.lastY = 0
		this.grab.reset()
		this.knob.position.set(0, 0)
		this.handlers.onDirection(0, 0)
		this.handlers.onHold(false)
	}

	// -------------------------------------------------------------------- chip

	private bindChip(): void {
		// A casting chip is held (the power bar runs while it is down) and a landing
		// chip is tapped, so both the press and the click are wired and `action`
		// decides which of them means anything.
		this.chip.on('pointerdown', (event) => {
			if (this.action === 'cast') this.handlers.onCastHold(true)
			void event
		})
		const release = (): void => {
			if (this.action === 'cast') this.handlers.onCastHold(false)
		}
		this.chip.on('pointerup', release)
		this.chip.on('pointerupoutside', release)
		this.chip.on('pointercancel', release)
		this.chip.on('pointertap', () => {
			if (this.action === 'land') this.handlers.onLand()
		})
	}

	// ------------------------------------------------------------------ public

	/**
	 * What the group shows. The stick belongs to a fish on the line, so between
	 * rounds only the chip is up — otherwise it would sit under the travel cards
	 * with no job to do.
	 */
	setMode(mode: ControlsMode): void {
		if (mode === this.mode) return
		this.mode = mode
		if (mode !== 'round') this.cancel()
		this.stick.visible = mode === 'round'
		this.chip.visible = mode !== 'hidden'
		this.visible = mode !== 'hidden'
		this.homeChip(mode === 'hidden')
	}

	/**
	 * Sends the chip to the home its mode asks for: above the travel card between
	 * casts, on the stick's centre line in a round. Hiding it lands the chip in
	 * its idle home at once — it is off screen for the catch screen's tail, and a
	 * chip that reappeared half a slide below its own corner would be a glitch.
	 */
	private homeChip(instant = false): void {
		const home = this.mode === 'round' ? CHIP_FIGHT : CHIP_CAST
		if (home.x === this.chipToX && home.y === this.chipToY) return
		this.chipFromX = this.chip.position.x
		this.chipFromY = this.chip.position.y
		this.chipToX = home.x
		this.chipToY = home.y
		this.chipSlide = instant ? 1 : 0
		if (instant) this.chip.position.set(home.x, home.y)
	}

	/** Eases the chip between its two homes; a snap reads as a second press. */
	private slideChip(dt: number): void {
		if (this.chipSlide >= 1) return
		this.chipSlide = Math.min(1, this.chipSlide + dt / CHIP_SLIDE)
		const eased = easeOutCubic(this.chipSlide)
		this.chip.position.set(
			lerp(this.chipFromX, this.chipToX, eased),
			lerp(this.chipFromY, this.chipToY, eased)
		)
	}

	/** What the chip does: cast, land, or nothing (dim and inert). */
	setAction(action: ChipAction): void {
		if (action === this.action) return
		this.action = action
		this.chip.eventMode = action === null ? 'none' : 'static'
		this.chip.cursor = action === null ? 'default' : 'pointer'
		this.drawChip()
	}

	/**
	 * Shows where the dash is, or hides the hint. Called every frame with the
	 * live sector angle; the cue is drawn on the pad's own face.
	 */
	setCue(angle: number | null): void {
		if (angle === this.cueAngle) return
		this.cueAngle = angle
		// A new sector starts unarmed even if the stick already points that way:
		// the answer is the push-and-pull, not the resting place.
		this.grab.reset()
		this.drawCue()
	}

	/**
	 * A bite is on the float: the pad lights and asks to be struck. Pressing the
	 * stick is the strike itself — the control only says when.
	 */
	setHookReady(ready: boolean): void {
		if (ready === this.hookReady) return
		this.hookReady = ready
		this.hookLabel.visible = ready
		this.drawHook()
	}

	/** Per-frame pulse of whatever is asking for a press. */
	update(dt: number): void {
		this.slideChip(dt)
		if (!this.hookReady && this.action === null) return
		this.time += dt
		const pulse = 0.55 + Math.sin(this.time * PULSE_RATE) * 0.45
		if (this.hookReady) this.drawHook(pulse)
		if (this.action !== null) this.drawGlow(pulse)
	}

	/** Drops the current gesture, e.g. when the round pauses under the player. */
	cancel(): void {
		if (this.pointerId === null) return
		this.releaseStick()
	}

	/**
	 * Rects the controls occupy, in scene pixels.
	 *
	 * The lesson note is laid out around the interface, and on a phone that
	 * interface is these two: a note over the pad hides the one gesture that
	 * answers the dash it is explaining, and a note over the chip hides the way
	 * out of the note itself.
	 */
	reservedRects(): UiRect[] {
		const rects: UiRect[] = []
		if (this.stick.visible) {
			rects.push({
				x: STICK.x - STICK.base,
				y: STICK.y - STICK.base,
				width: STICK.base * 2,
				height: STICK.base * 2
			})
		}
		if (this.chip.visible) {
			rects.push({ x: this.chip.x, y: this.chip.y, width: CHIP.width, height: CHIP.height })
		}
		return rects
	}

	// ------------------------------------------------------------------- paint

	private drawStick(): void {
		const g = this.stickBase
		g.clear()
		g.circle(0, 0, STICK.base).fill({ color: UI.ink, alpha: 0.32 })
		g.circle(0, 0, STICK.base).stroke({
			width: 1,
			color: UI.ink,
			alpha: 0.75
		})
		g.circle(0, 0, STICK.base - 1).stroke({
			width: 1,
			color: UI.periwinkle,
			alpha: 0.45
		})
		// Four ticks on the axes: the pad is a control, not a smudge on the water.
		for (const [dx, dy] of [
			[0, -1],
			[1, 0],
			[0, 1],
			[-1, 0]
		] as const) {
			const inner = STICK.base - 7
			g.moveTo(dx * inner, dy * inner)
				.lineTo(dx * (STICK.base - 3), dy * (STICK.base - 3))
				.stroke({ width: 1, color: UI.periwinkle, alpha: 0.5 })
		}
	}

	private drawCue(): void {
		const g = this.stickCue
		g.clear()
		if (this.cueAngle === null) return
		const half = zoneArc() + STICK_GRAB_SLACK
		const inner = STICK.knob + 4
		const outer = STICK.base - 2
		const from = this.cueAngle - half
		const to = this.cueAngle + half
		g.moveTo(Math.cos(from) * inner, Math.sin(from) * inner)
			.arc(0, 0, outer, from, to)
			.lineTo(Math.cos(to) * inner, Math.sin(to) * inner)
			.arc(0, 0, inner, to, from, true)
			.closePath()
			.fill({ color: UI.rose, alpha: 0.3 })
	}

	/** The bite's ring around the pad: amber, so it cannot be read as a dash. */
	private drawHook(pulse = 1): void {
		const g = this.stickHook
		g.clear()
		if (!this.hookReady) return
		g.circle(0, 0, HOOK_RING).stroke({
			width: 2,
			color: UI.amber,
			alpha: 0.35 + pulse * 0.65
		})
		g.circle(0, 0, HOOK_RING + 2).stroke({
			width: 1,
			color: UI.ink,
			alpha: 0.35
		})
	}

	private drawKnob(): void {
		const g = this.knob
		g.clear()
		g.circle(0, 0, STICK.knob).fill({ color: UI.primary, alpha: 0.95 })
		g.circle(0, 0, STICK.knob).stroke({
			width: 1,
			color: UI.ink,
			alpha: 0.9
		})
		g.circle(0, -STICK.knob / 2, 2).fill({
			color: UI.periwinklePale,
			alpha: 0.8
		})
	}

	private drawChip(): void {
		const live = this.action !== null
		const panel = this.chipPanel
		panel.clear()
		drawPanel(panel, 0, 0, CHIP.width, CHIP.height, {
			fill: live ? UI.primary : UI.panel,
			alpha: 0.94,
			shadow: live
		})
		drawPanelFrame(panel, 0, 0, CHIP.width, CHIP.height)
		this.drawChipMarks(live ? 1 : 0.7)
		this.chipGlow.clear()
		if (live) this.drawGlow(1)
	}

	/**
	 * Shows the chip's mark: the rod for a cast, the hook for the catch.
	 *
	 * The button has no label — at this size a two-word caption was the smallest
	 * thing on the frame, and the mark says the same thing. A mark is dimmed, not
	 * lost, while the chip cannot be pressed: between the cast and the catch the
	 * hook is what the chip is promising, so it stays on the plate.
	 */
	private drawChipMarks(alpha: number): void {
		const cast = this.action === 'cast'
		this.castMark.visible = cast
		this.landMark.visible = !cast
		this.castMark.alpha = alpha
		this.landMark.alpha = alpha
	}

	private drawGlow(alpha: number): void {
		const g = this.chipGlow
		g.clear()
		if (this.action === null || alpha <= 0) return
		g.rect(-2, -2, CHIP.width + 4, CHIP.height + 4).stroke({
			width: 1,
			color: UI.amber,
			alpha: 0.35 + alpha * 0.65
		})
	}
}
