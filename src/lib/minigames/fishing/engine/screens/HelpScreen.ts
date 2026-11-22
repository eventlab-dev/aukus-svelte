import { VIEW } from '../config'
import type { GameContext } from '../GameContext'
import { easeOutCubic } from '../utils'
import { Screen } from '../ui/Screen'
import { Scrim } from '../ui/Scrim'
import { HelpCard, HELP_FLY_LIFT, HELP_FLY_TIME, HELP_SCRIM_TIME } from '../ui/HelpCard'

/**
 * How long the card takes to leave the frame, in seconds. It matches the fly-in,
 * so the manual opens and closes with one motion.
 */
const FLY_OUT_TIME = HELP_FLY_TIME

/**
 * «Как играть», the menu's popup: the help card plus the motion that brings it
 * over the title screen.
 *
 * The card itself lives in `ui/HelpCard.ts` because the same manual is also
 * shown mid-round, the first time a mechanic comes up (`ui/TutorialOverlay.ts`),
 * and the popup and that lesson have to be the same object — a second layout
 * would drift the moment the copy changed.
 */
export class HelpScreen extends Screen {
	override readonly popup = true
	/**
	 * The popup flies itself: only the card moves. Letting the manager slide the
	 * whole screen dragged the dark sheet across the menu with the panel, which
	 * read as a second page passing over the first instead of a dialog opening on
	 * top of it. The codex closes the same way.
	 */
	override readonly selfFlown = true
	private readonly game: GameContext
	private readonly card: HelpCard
	private readonly scrim = new Scrim()
	private intro = 0
	private outro = 0

	constructor(game: GameContext) {
		super()
		this.game = game
		this.scrim.alpha = 0
		this.addChild(this.scrim)
		this.card = new HelpCard(game, () => this.close())
		this.addChild(this.card)
		// The card starts below its resting place and out of sight: the dimmer is
		// already there, the panel rises into it.
		this.card.y = HELP_FLY_LIFT
		this.card.alpha = 0
	}

	/** The rise, played once on entry. */
	override update(dt: number): void {
		if (this.intro >= 1) return
		this.intro = Math.min(1, this.intro + dt / HELP_FLY_TIME)
		const eased = easeOutCubic(this.intro)
		this.card.y = HELP_FLY_LIFT * (1 - eased)
		this.card.alpha = eased
		this.scrim.alpha = Math.min(1, this.intro / (HELP_SCRIM_TIME / HELP_FLY_TIME))
	}

	/**
	 * The card drops out of the frame while the dimmer fades where it stands.
	 * Sliding the whole screen, as an ordinary popup does, dragged the dark sheet
	 * down with the panel and left the menu dimmed from the top.
	 */
	override animateOut(dt: number): void {
		if (this.outro === 0) {
			// Nothing may take a click while the dialog is leaving.
			this.scrim.eventMode = 'none'
			this.card.interactiveChildren = false
		}
		this.outro = Math.min(1, this.outro + dt / FLY_OUT_TIME)
		const eased = easeOutCubic(this.outro)
		this.card.y = VIEW.height * eased
		this.card.alpha = 1 - eased
		this.scrim.alpha = Math.min(this.scrim.alpha, 1 - eased)
	}

	/**
	 * The close mark already answered with the interface's own click when the
	 * button was pressed, so stepping back to the title adds no second cue: the
	 * «cancel» sample made the cross read as a different control from every other
	 * button in the game.
	 */
	private close(): void {
		this.game.showMenu()
	}

	override onEnter(): void {
		// No button is outlined until the keyboard is used: the ring marks where
		// an arrow key will land, not a choice that has already been made.
	}

	override onExit(): void {
		this.card.blur()
	}

	override handleKey(event: KeyboardEvent): boolean {
		if (event.code === 'Escape' || event.code === 'Backspace') {
			this.close()
			return true
		}
		return this.card.handleKey(event)
	}
}
