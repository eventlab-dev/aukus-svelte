import { CURSORS } from '../../cursors'
import type { HelpPageId } from '../../texts'
import { CodexOverlay } from '../../ui/CodexOverlay'
import { TutorialHint, DASH_HOLD, HINT_HOLD, type HintLandscape } from '../../ui/TutorialHint'
import { GameScreenCore } from './GameScreenCore'

export abstract class GameOverlays extends GameScreenCore {
	protected openPause(): void {
		if (this.paused) return
		this.freezeRound()
		this.pauseMenu.open()
		// No click here: the HUD pause button is a Button and already plays one,
		// so cueing it again made every pause sound like a double press.
	}

	/**
	 * Stops the round and ducks its audio, without deciding what covers it: the
	 * pause dialog, the codex and a lesson all open over a frozen frame.
	 *
	 * `recharge` is passed by the lesson path: the dash that is live on the frozen
	 * frame keeps its counter window for the resume instead of costing a miss.
	 */
	protected freezeRound(recharge = false): void {
		this.paused = true
		this.resetGesture()
		this.flow.setPaused(true, recharge)
		// The round goes quiet under an overlay: a lake bed, a reel or a landed
		// chime still ringing would keep playing behind a frozen picture.
		this.game.audio.setPaused(true)
		// The flow may have cancelled the charge; clear the meter immediately
		// instead of leaving the last frame frozen behind the overlay.
		this.hud.update(0, null)
		this.castHint.visible = false
		this.inputCatcher.cursor = CURSORS.default
	}

	protected unfreezeRound(): void {
		this.paused = false
		this.flow.setPaused(false)
		this.game.audio.setPaused(false)
	}

	protected closePause(silent = false): void {
		if (!this.paused) return
		const hadCodex = this.codex !== null
		// The codex flies out over the round that is about to run again; the screen
		// drops it when the animation is over (see `updateCodex`), exactly like the
		// pause panel itself.
		this.codex?.beginClose()
		this.unfreezeRound()
		this.pauseMenu.close()
		if (!silent && !hadCodex) this.game.audio.back()
	}

	protected openCodex(): void {
		if (this.codex) return
		// The codex is modal over a frozen round. The HUD's codex button opens it
		// without the pause dialog, so the freeze happens here; from the dialog the
		// round is already frozen and only the dialog has to give up the keyboard.
		if (!this.paused) this.freezeRound()
		this.pauseMenu.blur()
		this.codex = new CodexOverlay(this.game, this.area.id, () => this.closeCodex())
		this.addChild(this.codex)
		// The control that opened it is a Button and already plays the click; a
		// second one here read as a stutter.
	}

	/** Starts the close; the overlay itself animates out from here. */
	protected closeCodex(): void {
		this.codex?.beginClose()
		// Straight from the HUD the codex is the whole overlay, so the round comes
		// back while the panel drops away. Behind the pause dialog — or behind a
		// lesson, which owns the pause it took — the round stays frozen.
		if (this.paused && !this.pauseMenu.isOpen && !this.tutorial) this.unfreezeRound()
	}

	/**
	 * Ticks the codex and drops it when its fly-out has landed. It runs while the
	 * round is paused and after it resumed, so a codex closed together with the
	 * pause menu still finishes its slide instead of vanishing.
	 */
	protected updateCodex(dt: number): void {
		const codex = this.codex
		if (!codex) return
		if (!codex.update(dt)) return
		codex.destroy({ children: true })
		this.codex = null
		// A dialog may still be standing behind the codex: hand the keyboard back
		// to its first entry, «продолжить». A codex opened from the HUD leaves no
		// dialog to return to.
		if (this.pauseMenu.isOpen) this.pauseMenu.focusAt(0)
	}

	// ---------------------------------------------------------------- lessons

	/**
	 * Stops the round and puts one lesson in the corner over it.
	 *
	 * The note is a layer of the frozen water rather than a screen: the player
	 * reads the rule on the picture it is about, and no dimmer or panel covers the
	 * fight. The round is frozen before the note exists; it is resumed by the first
	 * press or key ({@link dismissLessonForInput}), not by closing a dialog.
	 */
	protected openLesson(lesson: HelpPageId): void {
		if (this.tutorial) return
		// Written to the saved document the moment the note opens: a reload after
		// reading it must not replay the lesson.
		this.game.progress.markLessonSeen(lesson)
		// Read before the freeze: a frozen round reports no dash, and the sector it
		// has stopped on is the thing the «КОНТРРЫВОК» note has to be placed around.
		const landscape = this.hintLandscape()
		// The lesson is read on the frozen frame, and the dash it froze is handed
		// back on the resume: reading must never cost a miss.
		if (!this.paused) this.freezeRound(true)
		this.pauseMenu.blur()
		// The cast waits for this note (see `CastFlowCore.setCastLocked`): from here
		// the press that closes «ЗАБРОС» has to reach the rod.
		this.flow.setCastLocked(false)
		// The dash note opens mid-dash, with the hand already pressing: it holds the
		// round for barely a beat, so the press that answers the dash also ends the
		// note. The other notes protect the press they were opened by.
		this.tutorial = new TutorialHint(
			this.game,
			lesson,
			lesson === 'counter' ? DASH_HOLD : HINT_HOLD,
			landscape,
			() => {
				// A dialog that took the round while the note was up (the host pausing
				// the page) owns the pause now; the lesson only resumes a round it still
				// holds.
				if (this.paused && !this.pauseMenu.isOpen && !this.codex) this.unfreezeRound()
			}
		)
		this.addChild(this.tutorial)
	}

	/**
	 * What the note has to be laid out around: the fight it explains and the
	 * interface it must not bury.
	 *
	 * The zone is taken from the live fight (its centre and the heading of the
	 * dash that is painted right now); the occupied rectangles are each widget's
	 * own footprint, so a control that moves is reported where it moved to
	 * instead of being guessed at from constants kept here.
	 */
	private hintLandscape(): HintLandscape {
		const ring = this.flow.fightCentre
		return {
			zone: ring ? { x: ring.x, y: ring.y, sector: this.flow.counterCue } : null,
			occupied: [
				...this.hud.reservedRects(),
				...(this.fightControls?.reservedRects() ?? []),
				...this.shortcuts.reservedRects(),
				...this.forecast.reservedRects()
			]
		}
	}

	/** Ticks the open lesson and drops it when its fade-out has landed. */
	protected updateLesson(dt: number): void {
		const tutorial = this.tutorial
		if (!tutorial) return
		if (!tutorial.update(dt)) return
		tutorial.destroy({ children: true })
		this.tutorial = null
	}

	/**
	 * The player acted while a lesson was up.
	 *
	 * Returns true when the input has to be swallowed: the note is still holding
	 * the round for its first quiet beat (`HINT_HOLD`), which exists so the press
	 * that hooked the fish does not wipe the text before it is read. Otherwise the
	 * note starts leaving, the round is live again, and the input is delivered —
	 * the action that ends the lesson is the action the player wanted.
	 */
	protected override dismissLessonForInput(): boolean {
		const hint = this.tutorial
		if (!hint || hint.isClosing) return false
		if (!hint.canDismiss) return true
		hint.beginClose()
		this.unfreezeRound()
		return false
	}

	/**
	 * Drops an open lesson without animating and leaves the round frozen: used
	 * when a host pause takes the screen, so the pause dialog never stacks on top
	 * of a note the player has stopped reading.
	 */
	protected dropLesson(): void {
		if (!this.tutorial) return
		this.tutorial.destroy({ children: true })
		this.tutorial = null
	}
}
