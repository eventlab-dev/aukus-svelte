import { FIGHT } from '../../config'
import { UI } from '../../ui/palette'
import { drawLockMark } from '../../ui/lockMark'
import { mixColor } from '../../world'
import { clamp } from '../../utils'
import { ESCAPE_GAUGE, GAUGE } from './setup'
import { zoneTuning } from '../fight/zoneTuning'
import { WarningView } from './WarningView'

/**
 * The player's stamina: a flat gauge lying over the water.
 *
 * It has been through both stages. First a plain 72×6 strip with a «СИЛА»
 * caption over it — interface furniture, not part of a fishing round. Then a
 * frosted glass tube with rounded ends, a lit liquid, a bright meniscus at the
 * level, frost pixels on the glass and a notch cut into the fill where the
 * reserve turns amber. The tube read as a different art style from everything
 * else in the scene (the bank and the pier are all hard pixel shapes),
 * and the marks sitting *inside* the fill broke the one reading that matters
 * mid-fight: how much is left.
 *
 * So: square corners, a 1px ink case, a flat liquid that fills from the left
 * with a hard edge, and state carried by the colour of the liquid and the rim.
 * The low-reserve threshold left the fill entirely — it is now a quiet tick
 * standing outside the left end of the gauge, the scale's own base mark.
 *
 * Under that gauge lives the срыв bar ({@link drawEscape}): the same recipe as
 * a hairline — two pixels of liquid, a one-pixel case, no halo — a little
 * narrower than the gauge and hidden until the escape clock carries any
 * pressure. The grip answers "can I pull", the срыв scale answers "how close is
 * the hook to tearing out", and the two are read as one stack: the thin bar is
 * the second reading of the same instrument, never a rival gauge.
 */

/** Inset of the liquid from the gauge's wall. */
const WALL = 1
/** Gap between the gauge's left edge and the base mark outside it. */
const MARK_GAP = 4
/** Height of that base mark; it overhangs the gauge by a pixel at each end. */
const MARK_OVERHANG = 1
/** Width of the padlock glyph, so it can be centred on the gauge. */
const LOCK_WIDTH = 7
/** Where the срыв bar's one-miss mark sits on the scale. */
const ESCAPE_HALF = 0.5
/** Risk at which the срыв bar starts pulsing instead of just filling. */
const ESCAPE_DANGER = 0.75
/** Breakdown of the срыв bar's fill: what is poured, and what is still coming. */
const ESCAPE_GHOST = 0.35

export abstract class BarsView extends WarningView {
	/**
	 * 0..1 fade of the срыв bar.
	 *
	 * The bar appears the moment the escape clock gains any pressure, and leaves
	 * the same way. A bar that popped in with a missed dash would read as a
	 * receipt for that one frame; fading it in makes it a scale that settles into
	 * the stack, and fading it out lets the player watch the risk drain away
	 * (which takes a while: the clock recovers slowly on purpose).
	 */
	private escapeFade = 0

	/**
	 * Advances the срыв bar's appearance. Separate from the paint because the
	 * value has to survive frames: the bar shows while the clock carries pressure,
	 * not while one frame happened to have some.
	 */
	protected updateEscape(dt: number): void {
		const target = this.model.escapeRisk > 0.004 ? 1 : 0
		const rate = target > this.escapeFade ? 14 : 8
		this.escapeFade += (target - this.escapeFade) * Math.min(1, dt * rate)
		if (this.escapeFade < 0.004) this.escapeFade = 0
	}

	/**
	 * The counter's receipt: one ice ring, on the float, expanding and fading.
	 *
	 * It used to be two static circles around the fish, which said "this fish is
	 * stunned" in the one place the player is not looking and in a shape that read
	 * as a second arena. The float is what the player tracks, so the pulse lives
	 * there: it appears at `cueSize`, runs out to `cueSize + cueGrow` over the
	 * stun, and is lit only while it moves (the sine brings it in and takes it out),
	 * so a counter reads as one breath and nothing stays behind.
	 */
	protected drawCue(): void {
		const g = this.cueG
		g.clear()
		if (this.model.stunValue <= 0) return

		const total = Math.max(0.05, zoneTuning.counterStun)
		const progress = clamp(1 - this.model.stunValue / total)
		const radius = zoneTuning.cueSize + zoneTuning.cueGrow * progress
		const point = this.floatPoint
		g.circle(point.x, point.y, radius).stroke({
			width: 1.5,
			color: UI.ice,
			alpha: Math.sin(Math.PI * progress) * 0.75
		})
	}

	/** The angler's stamina: a flat gauge filled from the left. */
	protected drawStamina(): void {
		const g = this.barG
		const width = GAUGE.width
		const height = GAUGE.height
		const x = this.model.centerX - width / 2
		const y = this.staminaY
		const pulse = (Math.sin(this.model.time * 8) + 1) / 2
		const value = clamp(this.model.gripValue)
		const locked = this.model.isGripLocked
		const low = value <= FIGHT.lowGrip || locked
		const liquid = locked ? UI.danger : low ? UI.amber : UI.ice
		const rim = locked ? UI.rose : low ? UI.amber : UI.periwinkle

		g.clear()

		// Dark halo, square like everything else: the gauge sits over open water,
		// and a bright bar with no shade behind it floated above the lake.
		g.rect(x - 2, y - 2, width + 4, height + 4).fill({
			color: UI.ink,
			alpha: 0.32
		})

		// Ink case and glass. The glass is a shade above ink so the empty part of
		// the gauge still reads as a gauge rather than a hole in the water.
		g.rect(x - 1, y - 1, width + 2, height + 2).fill(UI.ink)
		g.rect(x, y, width, height).fill({
			color: mixColor(UI.ink, UI.periwinkle, 0.16),
			alpha: 0.92
		})

		const inner = width - WALL * 2
		const fill = Math.max(0, Math.round(inner * value))
		if (fill > 0) {
			// The reserve itself: one flat block. A highlight, a bottom shade or a
			// meniscus would each put a second edge inside the column the player is
			// reading, so the level is simply where the block stops.
			g.rect(x + WALL, y + WALL, fill, height - WALL * 2).fill(liquid)
		}

		// Base mark of the scale: a quiet tick standing outside the left end, where
		// the low-reserve threshold used to be cut into the fill.
		const markX = Math.round(x) - MARK_GAP
		g.rect(markX, y - MARK_OVERHANG, 1, height + MARK_OVERHANG * 2).fill({
			color: rim,
			alpha: locked ? 0.55 + pulse * 0.45 : 0.6
		})

		// The rim carries the state: periwinkle while there is reserve, amber at the
		// threshold, rose and pulsing once the grip is locked out.
		g.rect(x - 1, y - 1, width + 2, height + 2).stroke({
			width: 1,
			color: rim,
			alpha: locked ? 0.55 + pulse * 0.45 : 0.6
		})

		// The lockout is the one state where a hold does nothing while the gauge
		// can still be full: the reserve comes back during the lock, but the pull is
		// refused until it expires. A colour alone read as "stamina I am not using",
		// so the gauge borrows the game's own padlock — the mark that closes a
		// water body — and the level stops promising a pull the model will not take.
		//
		// It sits in the middle of the scale, not beside it: at the left edge it
		// hung off the gauge like a stray prop, while the caption that explains it
		// («нет сил») already rises out of the centre. Centred, it also has to stay
		// readable on whatever is under it — red liquid on one side of the level,
		// dark glass on the other — so it is drawn in ice white with an ink contour
		// behind it instead of the rose it used to share with the bar.
		if (locked) {
			const lockX = Math.round(x + width / 2 - (LOCK_WIDTH - 1) / 2)
			drawLockMark(g, lockX, Math.round(y), 1, UI.primary, UI.ink, UI.ink)
		}
	}

	/**
	 * The срыв bar: the escape clock as a red scale under the grip gauge.
	 *
	 * It replaces the reddening waterline of the float, which was the only cue for
	 * a rule the whole fight rests on: a dash nobody answered pours half of this
	 * bar in, and a second miss in a row tears the hook out. A colour spreading
	 * across the float read as decoration — the float was already sinking, and a
	 * warmer ring around it said nothing about two misses. A scale under the gauge
	 * the player is watching reads as a number: it fills from the left, marks the
	 * halfway point of one miss, and turns from periwinkle to a pulsing rose when
	 * the next one would be fatal.
	 *
	 * The share that a miss has deposited but not yet paid in is drawn as the
	 * dimmer segment ahead of the solid block, so the arrival of a miss is
	 * visible as a segment coming in rather than as the bar jumping.
	 */
	protected drawEscape(): void {
		const g = this.escapeG
		g.clear()
		g.alpha = this.escapeFade
		if (this.escapeFade <= 0) return

		const risk = clamp(this.model.escapeRisk)
		const meter = clamp(this.model.escapeMeter)
		const { width, height } = ESCAPE_GAUGE
		const x = this.model.centerX - width / 2
		const y = this.staminaY + GAUGE.height + ESCAPE_GAUGE.gap
		const pulse = (Math.sin(this.model.time * 8) + 1) / 2
		const near = risk >= ESCAPE_DANGER

		// The same ink case as the grip gauge, but without its two-pixel halo: the
		// срыв bar is a hairline, and a soft shadow two pixels wide on a two-pixel
		// scale would weigh more than the bar itself. The case keeps it readable
		// over bright water without turning it back into a second gauge.
		g.rect(x - 1, y - 1, width + 2, height + 2).fill(UI.ink)
		g.rect(x, y, width, height).fill({
			color: mixColor(UI.ink, UI.periwinkle, 0.16),
			alpha: 0.92
		})

		// The one-miss mark, under the fill: two missed dashes always fill the
		// scale, so its halfway point is what "one miss" actually costs.
		g.rect(Math.round(x + width * ESCAPE_HALF), y, 1, height).fill({
			color: UI.periwinkle,
			alpha: 0.4
		})

		const poured = Math.round(width * meter)
		const total = Math.round(width * risk)
		if (total > poured) {
			g.rect(x + poured, y, total - poured, height).fill({
				color: UI.rose,
				alpha: ESCAPE_GHOST
			})
		}
		if (poured > 0) g.rect(x, y, poured, height).fill({ color: UI.rose, alpha: 0.95 })

		// The rim carries the state: periwinkle while the clock is survivable, rose
		// and pulsing once the next miss would end the round.
		g.rect(x - 1, y - 1, width + 2, height + 2).stroke({
			width: 1,
			color: near ? UI.rose : UI.periwinkle,
			alpha: near ? 0.5 + pulse * 0.5 : 0.55
		})
	}
}
