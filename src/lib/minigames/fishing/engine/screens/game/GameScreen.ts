import type { AreaId, WeatherId } from '../../types'
import type { FederatedPointerEvent } from 'pixi.js'
import { CURSORS } from '../../cursors'
import type { HelpPageId } from '../../texts'
import type { WipePoint } from '../../ui/GridWipe'
import type { CastPhase } from '../../game/cast/setup'
import { INTRO_DURATION, LAND_RING_CLOSE } from '../../game/fightView/setup'
import { GameOverlays } from './GameOverlays'

/**
 * How long the round runs before the first lesson may land on it, in seconds.
 *
 * The grid wipe that brings the water in takes about half a second; a dialog
 * that rose out of the ink before the picture had settled read as part of the
 * transition.
 */
const LESSON_LEAD = 0.5

/**
 * How long the fight has to exist before the fight note may stop it.
 *
 * The circle and the fish are built and faded in over `INTRO_DURATION`; a note
 * that stopped the round before that left a frozen frame with no battlefield on
 * it — the rule pointed at a ring that was not there yet.
 */
const FIGHT_READ = INTRO_DURATION + 0.15

/**
 * How long the red zone has to be on screen before the dash note may stop the
 * round, in seconds.
 *
 * The zone fades in over `zoneTuning.fadeIn` (0.15 s), and the counter window
 * opens in the same instant it starts: stopping the frame before the sector has
 * been seen left the player reading a rule about a shape that was not on screen
 * yet. A quarter of a second is a readable flash, and the note then keeps the
 * sector up while it explains it.
 */
const COUNTER_READ = 0.25

/**
 * How long the landing ring has to be on screen before the landing note stops
 * the round. The ring closes onto the tired fish over `LAND_RING_CLOSE`; stopped
 * earlier, the frame showed the note over a ring that had not closed yet.
 */
const LAND_READ = LAND_RING_CLOSE + 0.1

export class GameScreen extends GameOverlays {
	/** Front the ambience bed is currently voiced for; see `update`. */
	private weatherId: WeatherId | null = null
	/** Phase of the previous frame, so a lesson can follow the change. */
	private lastPhase: CastPhase = 'idle'
	/** Seconds this round has been running, for `LESSON_LEAD`. */
	private roundClock = 0
	/** Seconds the fight has been running, for `FIGHT_READ`. */
	private fightLife = 0
	/** How long the red zone has been painted, for `COUNTER_READ`. */
	private counterLife = 0
	/** How long the landing ring has been up, for `LAND_READ`. */
	private landLife = 0

	protected switchArea(areaId: AreaId, origin: WipePoint): void {
		if (areaId === this.area.id) return
		this.flow.setPaused(true)
		this.game.startGame(areaId, origin)
	}

	/**
	 * Dev-only: presents a pearl catch at a chosen flaw without a fight. The
	 * reveal and the progress record are the real ones; only the fight is
	 * skipped, because a scripted browser cannot play a convincing one.
	 */
	debugCatchPearl(float?: number): boolean {
		if (!import.meta.env.DEV || this.paused || this.codex) return false
		return this.flow.debugCatchPearl(float)
	}

	// ------------------------------------------------------------------- input

	/** Cursor position in virtual screen units, not canvas pixels. */
	protected trackPointer(event: FederatedPointerEvent): void {
		const point = event.getLocalPosition(this)
		this.flow.setPointer(point.x, point.y)

		// A touch screen paints no cursor at all, so there is no token to switch:
		// the round's dot and the menu arrow exist only under a pointer.
		if (this.game.touch) return

		// Button/scrollbar targets own their own cursor. Only repaint the cursor
		// while the catcher itself is hovered, otherwise globalpointermove would
		// overwrite the custom pointer over UI controls.
		if (event.target !== this.inputCatcher) return

		// The round has exactly one cursor: the dot. It used to switch back to the
		// menu arrow whenever the pointer left open water, which put a big pointer
		// in the middle of the river bank. Only the HUD and the pause menu are
		// allowed to show a different cursor.
		this.inputCatcher.cursor =
			this.paused || this.isOverHud(point.x, point.y) ? CURSORS.default : CURSORS.crosshair
	}

	/**
	 * True where the pointer must show the menu arrow instead of the fishing dot:
	 * the HUD card and, while charging, the power bar. The cast prompt is *not*
	 * here on purpose — it is a caption, not a control, and switching the cursor
	 * over it looked like the label could be clicked.
	 */
	protected isOverHud(x: number, y: number): boolean {
		if (this.shortcuts.hitTest(x, y)) return true
		if (this.forecast.hitTest(x, y)) return true
		return this.flow.phase === 'charging' && this.hud.isOverPowerBar(x, y)
	}
	override handleKey(event: KeyboardEvent): boolean {
		// A lesson in the corner owns the first key: swallowed while it still holds
		// the round, and ending it once that beat is over — the same key then goes
		// on to do what it does, so the player never presses twice for one action.
		if (this.dismissLessonForInput()) return true
		if (this.codex && !this.codex.isClosing) {
			return this.codex.handleKey(event)
		}
		if (this.paused) {
			if (event.code === 'Escape') {
				this.closePause()
				return true
			}
			if (event.code === 'KeyC') {
				this.game.audio.click()
				this.openCodex()
				return true
			}
			return this.pauseMenu.handleKey(event)
		}
		if (event.code === 'Escape') {
			// Keyboard entries have no Button to play for them, so the click is
			// cued here instead of inside the openers (which the mouse already
			// covers and used to double).
			this.game.audio.click()
			this.openPause()
			return true
		}
		if (event.code === 'KeyC') {
			// The same control the HUD carries: the codex freezes the round itself,
			// so the pause dialog is not part of the path (see `openCodex`).
			this.game.audio.click()
			this.openCodex()
			return true
		}
		return this.flow.handleKeyDown(event)
	}

	override handleKeyUp(event: KeyboardEvent): void {
		this.flow.handleKeyUp(event)
	}

	// ----------------------------------------------------------------- update

	override update(dt: number): void {
		// The pause dialog animates in and out even though the round is frozen
		// under it, or already running again while it drops away.
		this.pauseMenu.update(dt)
		// The codex rides the same clock: it opens and closes while paused, and it
		// finishes its fly-out after the round resumed under it.
		this.updateCodex(dt)
		// So does a lesson: it rises over the frozen water and drops away while the
		// round is already running again underneath.
		this.updateLesson(dt)
		if (this.paused) return

		this.roundClock += dt

		const clock = this.game.clock
		const palette = clock.palette
		const weatherDef = clock.weatherDefFor(this.area.id)
		// A new front brings its own air; the bed crossfades on the same frame the
		// sky starts to turn, so the ear and the eye agree about the weather. The
		// front itself is advanced by the host tick, on every screen, so a front
		// that passed while the page was hidden is already in place here.
		if (weatherDef.id !== this.weatherId) {
			this.weatherId = weatherDef.id
			this.game.audio.setWeather(weatherDef.id)
		}
		this.scene.tint = palette.tint
		this.scene.setLantern(palette.lantern)
		this.scene.setCloudiness(weatherDef.cloud)
		this.atmosphere.setWorld(palette, weatherDef)
		const current = this.scene.current
		this.atmosphere.setCurrent(current.x, current.y)
		this.atmosphere.update(dt)

		this.scene.update(dt)
		this.juice.update(dt)
		this.updateCastHint(dt)
		this.floaters.update(dt)
		this.forecast.update(dt)
		this.shortcuts.update(dt)

		this.flow.update(dt)
		this.hud.update(
			dt,
			this.flow.phase === 'charging'
				? { charge: this.flow.charge, luckCenter: this.flow.luckBandCenter }
				: null
		)

		// The travel cards and the weather rail step aside for the fight: a corner
		// click during the landing window would drop the fish and the lake in one
		// go, and the rail has no business being the brightest thing on screen
		// while the focus darkens the lake. The corners themselves do not stay
		// empty: that strip is where the two thumbs sit for the duration.
		const phase = this.flow.phase
		const fighting = phase === 'fighting'
		if (!fighting !== this.shortcutsAvailable) {
			this.shortcutsAvailable = !fighting
			this.shortcuts.setAvailable(!fighting)
			this.forecast.setDimmed(fighting)
		}

		const controls = this.fightControls
		if (controls) {
			// The chip is up between rounds too: on a phone it is the cast button.
			// The stick joins it once a float is on the water, which is where the
			// waiting, the bite and the fight all live.
			const idle = phase === 'idle'
			const casting = phase === 'charging'
			const inRound = fighting || phase === 'waiting' || phase === 'bite'
			controls.setMode(inRound ? 'round' : idle || casting ? 'idle' : 'hidden')
			if (inRound || idle || casting) {
				// One chip, two jobs: cast while there is no fish on the line, land
				// when the fish is on the threshold, and dim the rest of the time so it
				// never promises an action it cannot take.
				controls.setAction(idle || casting ? 'cast' : this.flow.landingReady ? 'land' : null)
				// The bite lights the stick itself, and a live dash mirrors its sector
				// on the pad so the counter has somewhere to be aimed under the thumb.
				controls.setHookReady(this.flow.hookReady)
				controls.setCue(this.flow.counterCue)
				controls.update(dt)
			}
			// The corner strip is the stick's whenever it is up: keeping the travel
			// cards under it would cover them and steal half of their taps.
			this.shortcuts.visible = !inRound
			this.forecast.visible = !inRound
		}

		// Last, so the lesson lands on a frame that has already been drawn: the
		// round stops the moment the mechanic appears, not one frame before it.
		this.teachCurrentMechanic(phase, dt)
	}

	/**
	 * Opens the manual the first time each mechanic comes up, and stops the round
	 * for it — the lesson is read on the picture it explains.
	 *
	 * One lesson per mechanic ever (`progress.lessons`), so the second cast and
	 * the second fight run without a dialog — and so does the first one after a
	 * reload. A lesson never opens on top of the pause dialog or the codex: those
	 * are the player's own questions and have the floor.
	 */
	private teachCurrentMechanic(phase: CastPhase, dt: number): void {
		const previous = this.lastPhase
		this.lastPhase = phase
		if (this.tutorial || this.codex || this.pauseMenu.isOpen) return
		if (phase === 'idle') {
			this.clearLessonClocks()
			// Let the grid wipe finish before a dialog lands on it.
			if (this.roundClock >= LESSON_LEAD) this.teach('cast')
			return
		}
		if (phase !== 'fighting') {
			this.clearLessonClocks()
			return
		}
		if (previous !== 'fighting') this.clearLessonClocks()
		this.fightLife += dt

		// Each note waits for the picture it is about to be on screen: the ring has
		// to have formed, the red sector has to have been painted, the golden ring
		// has to have closed. Stopping the round a moment before that left the
		// player reading about a shape that was not there yet.
		if (!this.game.progress.lessonSeen('fight')) {
			if (this.fightLife >= FIGHT_READ) this.teach('fight')
			return
		}
		if (this.flow.counterCue !== null) {
			this.counterLife += dt
			if (this.counterLife >= COUNTER_READ) this.teach('counter')
			return
		}
		this.counterLife = 0
		if (!this.game.progress.lessonSeen('land') && this.flow.landingReady) {
			this.landLife += dt
			if (this.landLife >= LAND_READ) this.teach('land')
			return
		}
		this.landLife = 0
	}

	/** The per-lesson clocks belong to one fight: a new one starts them at zero. */
	private clearLessonClocks(): void {
		this.fightLife = 0
		this.counterLife = 0
		this.landLife = 0
	}

	/** Shows one lesson unless the saved document has already had it. */
	private teach(lesson: HelpPageId): void {
		if (this.game.progress.lessonSeen(lesson)) return
		this.openLesson(lesson)
	}

	protected updateCastHint(dt: number): void {
		// A phone has no "ready to cast" caption: the cast has its own chip in the
		// corner, and a prompt over the water would only name a gesture that is no
		// longer there.
		const alpha = this.game.touch ? 0 : this.flow.castPromptAlpha
		this.castHint.visible = alpha > 0
		this.castHint.alpha = alpha
		if (alpha > 0) this.castHint.tick(dt)
	}

	// --------------------------------------------------------------- lifecycle

	/**
	 * The beds follow the visible screen, not the constructor: a screen is built
	 * before the outgoing one is disposed, so starting the round's sound there
	 * would be undone by the old screen's own exit.
	 */
	override onEnter(): void {
		this.game.audio.setAmbience(this.area.id)
		const weather = this.game.clock.weatherDefFor(this.area.id).id
		this.weatherId = weather
		this.game.audio.setWeather(weather)
		// Fetch the cast/fight cues now, not on the first pointerdown: the round
		// starts in a second and `play` would otherwise wait on the network.
		this.game.audio.preloadRound()
	}

	override onHostPause(paused: boolean): void {
		// The host paused the page under an open lesson: the lesson gives way to
		// the pause dialog instead of stacking two panels, and the round stays
		// frozen between them (it is frozen again by `openPause`).
		if (paused && this.tutorial) {
			this.dropLesson()
			this.unfreezeRound()
		}
		if (paused) this.openPause()
		else this.closePause()
	}

	override onExit(): void {
		// A lesson is a layer of the round, not a screen: it leaves with the water.
		this.dropLesson()
		this.game.clock.persist()
		void this.game.flushProgress()
		// A round left through the pause menu must not leave the world bus ducked
		// for the menu that follows.
		this.game.audio.setPaused(false)
		// Menus keep the water bed but have no sky, so the weather bed leaves with
		// the round instead of howling over the title screen.
		this.game.audio.setWeather(null)
		this.inputCatcher.cursor = CURSORS.default
		// The stick belongs to the round: leaving it held would keep the reel
		// sounding over the menu.
		this.fightControls?.cancel()
		this.game.app.canvas.removeEventListener('contextmenu', this.handleContextMenu)
	}

	override onMuteChanged(): void {
		this.pauseMenu.refreshSound()
	}

	/**
	 * The dev mixer (`F2`) has to hear what it is tuning: auditions of the cues
	 * and of the ambience beds are made on the same bus the pause duck silences.
	 * While the panel is up the duck is lifted; closing it restores the round's
	 * own state, whatever that is by then.
	 */
	override onAudioPanel(open: boolean): void {
		this.game.audio.setPaused(open ? false : this.paused)
	}

	/** Dev hook (`F3`): show a newly picked front without the 8 s blend. */
	snapWeather(): void {
		const def = this.game.clock.weatherDefFor(this.area.id)
		this.atmosphere.snapTo(def)
		this.scene.snapCloudiness(def.cloud)
	}
}
