import type { GameContext } from '../GameContext'
import { VIEW } from '../config'
import { easeOutCubic } from '../utils'
import { Screen } from '../ui/Screen'
import { Scrim } from '../ui/Scrim'
import { CodexView } from '../ui/CodexView'
import {
	CODEX_FLY_LIFT,
	CODEX_FLY_OUT_TIME,
	CODEX_FLY_TIME,
	CODEX_SCRIM_TIME
} from '../ui/CodexOverlay'

/**
 * Full-screen codex host for the title screen.
 *
 * It is a popup, not a page: the dimmer is a static scrim, and only the panel
 * rises into it. The manager is told to leave the screen in place
 * (`selfFlown`), so the dimming never slides along with the panel. Closing runs
 * the same motion backwards through `animateOut`: the panel drops out of the
 * frame while the dimmer fades where it stands.
 */
export class CodexScreen extends Screen {
	override readonly popup = true
	override readonly selfFlown = true
	private readonly scrim = new Scrim()
	private readonly view: CodexView
	private intro = 0
	private outro = 0

	constructor(game: GameContext) {
		super()
		this.scrim.alpha = 0
		this.addChild(this.scrim)

		this.view = new CodexView(game, game.areaId, () => game.showMenu())
		this.view.y = CODEX_FLY_LIFT
		this.view.alpha = 0
		this.addChild(this.view)
	}

	override update(dt: number): void {
		if (this.intro >= 1) return
		this.intro = Math.min(1, this.intro + dt / CODEX_FLY_TIME)
		const eased = easeOutCubic(this.intro)
		this.view.y = CODEX_FLY_LIFT * (1 - eased)
		// A slow fade under the rise: the panel used to snap to full opacity in
		// about a sixth of a second, which is what made the opening feel abrupt.
		this.view.alpha = eased
		this.scrim.alpha = Math.min(1, this.intro / (CODEX_SCRIM_TIME / CODEX_FLY_TIME))
	}

	/**
	 * The panel drops away and the dimmer fades in place. Sliding the whole
	 * screen, as the manager does for an ordinary popup, dragged the dark sheet
	 * down with the panel and left the screen underneath dimmed from the top.
	 */
	override animateOut(dt: number): void {
		if (this.outro === 0) {
			// Nothing may take a click while the codex is leaving.
			this.scrim.eventMode = 'none'
			this.view.interactiveChildren = false
		}
		this.outro = Math.min(1, this.outro + dt / CODEX_FLY_OUT_TIME)
		const eased = easeOutCubic(this.outro)
		this.view.y = VIEW.height * eased
		this.view.alpha = 1 - eased
		this.scrim.alpha = Math.min(this.scrim.alpha, 1 - eased)
	}

	override handleKey(event: KeyboardEvent): boolean {
		if (this.outro > 0) return false
		return this.view.handleKey(event)
	}
}
