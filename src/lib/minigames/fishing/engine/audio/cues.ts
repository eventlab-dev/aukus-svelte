import { AudioCore } from './core'
import { CAST_BLEND } from './catalog'

/**
 * Playback rate of the «grip out» cue: the escape sample, pitched up.
 *
 * 1.12 is roughly two semitones — audible as a different take of the same tear
 * without reading as a separate, louder event.
 */
const GRIP_OUT_PITCH = 1.12

/** One-shot cues: interface clicks, fishing feedback and fight telegraphs. */
export abstract class CueBank extends AudioCore {
	protected abstract stopCharge(release?: number): void

	// ------------------------------------------------------------ interface

	hover(): void {
		this.play('select', this.mix.hover, 1 + Math.random() * 0.06, 0, true)
	}

	click(): void {
		this.play('button', this.mix.click, 1 + Math.random() * 0.04, 0, true)
	}

	back(): void {
		this.play('cancel', this.mix.back, 1, 0, true)
	}

	// --------------------------------------------------------------- fishing

	cast(): void {
		this.play('cast', this.mix.cast, 1 + Math.random() * 0.03)
		// The throw owns the hand-over: the whoosh is already sounding when the
		// wind-up starts to leave, so the two overlap for `CAST_BLEND`.
		this.stopCharge(CAST_BLEND)
	}

	splash(): void {
		this.play('waterScoop', this.mix.splash, 1 + Math.random() * 0.05)
	}

	/** Bobber touches the water. */
	plop(): void {
		this.play('bob', this.mix.plop, 1 + Math.random() * 0.04)
	}

	bite(): void {
		this.play('bite', this.mix.bite)
	}

	/**
	 * The strike that sets the hook: the rod snaps and the line goes taut.
	 *
	 * `fishHit` is the pack's own hit cue. It is deliberately unlike the catch
	 * fanfare — a strike is an action, over in under a second, not a reward.
	 * `jingle1` used to stand in here only because this cue had not been wired
	 * into the catalog.
	 */
	hook(): void {
		this.play('fishHit', this.mix.hook)
	}

	nibble(): void {
		this.play('waterLap', this.mix.nibble, 1 + Math.random() * 0.06)
	}

	catchFish(): void {
		this.play('reward', this.mix.catchCommon)
	}

	escape(): void {
		this.play('escape', this.mix.escape)
	}

	/**
	 * Telegraph: a strong dash is about to happen.
	 *
	 * The dash is announced by the bright `crit` chime. It is the one cue in the
	 * mix with a hard, high onset, so it cuts through a fight that already has a
	 * reel sustain under it, and it is over before the dash resolves — the ear
	 * gets the warning without the sound running into the move it announces.
	 */
	warn(): void {
		this.play('crit', this.mix.warn, 1 + Math.random() * 0.04)
	}

	/**
	 * Successful counter-pull: the rod snaps the line taut and the dash is
	 * cancelled.
	 *
	 * A quarter-second, very bright swipe. The metallic parry that used to play
	 * here is a sword block — it is the single most out-of-place cue in a
	 * fishing fight.
	 */
	counter(): void {
		this.play('lineSnap', this.mix.counter, 1 + Math.random() * 0.03)
	}

	/** The fish is tired and can be landed. */
	ready(): void {
		this.play('shiny', this.mix.ready)
	}

	/**
	 * Landing window opened: RMB/F or a tap on the tired fish now lands it.
	 *
	 * It is the bite, note for note: the same cue that told the player "a fish is
	 * on" is the one that now tells them "it is spent, take it". That keeps the
	 * round to one signal for "act now" instead of asking the ear to learn a
	 * second one at the exact moment the hands have to move.
	 */
	landReady(): void {
		this.play('bite', this.mix.landReady)
	}

	/**
	 * Cast released inside the luck zone: the completion chime over the throw.
	 *
	 * It plays on the same frame as the whoosh, so the zone reads as one
	 * confirmed event.
	 */
	objective(): void {
		this.play('objective', this.mix.objective)
	}

	/** Landing strike attempted too early. */
	resist(): void {
		this.play('thud', this.mix.resist)
	}

	/**
	 * Grip reserve burned out: the line tears loose for a moment.
	 *
	 * It is the escape sample a notch brighter than the fish's own break-off
	 * (`escape()`): the two moments are different things — the fish tearing free
	 * ends the fight, a burnt-out grip only costs the player a beat — and until
	 * now they were the same sound at the same pitch. A twelfth of an octave up is
	 * enough for the ear to tell them apart without turning the loss into a
	 * fanfare over the fight that is still running.
	 */
	gripOut(): void {
		this.play('escape', this.mix.gripOut, GRIP_OUT_PITCH)
	}

	comboBreak(): void {
		this.play('cancel', this.mix.comboBreak)
	}

	newRecord(): void {
		this.play('newRecord', this.mix.newRecord)
	}
}
