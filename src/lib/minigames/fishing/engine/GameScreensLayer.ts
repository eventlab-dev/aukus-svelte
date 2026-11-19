import { MenuScreen } from './screens/MenuScreen'
import { HelpScreen } from './screens/HelpScreen'
import { CodexScreen } from './screens/CodexScreen'
import { GameScreen } from './screens/GameScreen'

import type { AreaId, CatchEvent } from './types'
import { GameDevLayer } from './GameDevLayer'
import { VIEW } from './config'
import type { WipePoint } from './ui/GridWipe'

/** Where a change that did not come from a pointer starts its wipe. */
const CENTRE: WipePoint = { x: VIEW.width / 2, y: VIEW.height / 2 }

export abstract class GameScreensLayer extends GameDevLayer {
	showMenu(): void {
		const active = this.screens.active
		// Leaving a round through the pause menu is a change of place as well: the
		// lake gives way to the title behind the same grid wave the travel cards
		// use — but running backwards, closing onto the middle of the frame where
		// the dialog sat. Going in spreads the water out of the click; coming out
		// pulls the frame back into it.
		if (active instanceof GameScreen) {
			this.screens.show(new MenuScreen(this), 'wipeIn', CENTRE)
			return
		}
		// Coming back from a popup drops it off the bottom edge instead of
		// flashing the frame; the first screen still uses the plain dip.
		const back = active?.popup === true
		this.screens.show(new MenuScreen(this), back ? 'flyOut' : 'fade')
	}

	showHelp(): void {
		this.screens.show(new HelpScreen(this), 'flyIn')
	}

	showCodex(): void {
		this.screens.show(new CodexScreen(this), 'flyIn')
	}

	/**
	 * Starts a round. This is the one navigation that gets the grid wipe instead
	 * of the flat dip: it always crosses to another water body, either from the
	 * title or from a travel card in the round.
	 *
	 * The wave always starts where the player clicked: a corner card passes its
	 * own centre, anything without a pointer passes the middle of the frame. It
	 * is a radial grid, never a flat wall, so the cells pop in one by one instead
	 * of one edge crossing the frame.
	 */
	startGame(areaId?: AreaId, origin: WipePoint = CENTRE): void {
		// A closed location is not a destination: a stale travel card, a host call
		// with an id that has just been blocked, or the saved selection all land on
		// the first water body that is still open instead of on a locked shore.
		const target = areaId && !this.isAreaLocked(areaId) ? areaId : this.firstOpenAreaId()
		if (target !== this.areaId) {
			this.progress.setArea(target)
		}
		void this.progress.flush()
		this.screens.show(new GameScreen(this, this.area), 'wipe', origin)
		this.skyPanel?.refresh()
	}

	/**
	 * Reacts to a host that opened or closed water bodies mid-session. The round
	 * never stays on a shore that has just been taken away, and the title's
	 * backdrop follows the water body the player will actually start on.
	 */
	protected refreshLocations(): void {
		const active = this.screens.active
		if (active instanceof GameScreen && this.isAreaLocked(this.area.id)) {
			this.startGame()
		} else if (active instanceof MenuScreen && active.areaId !== this.areaId) {
			this.showMenu()
		}
	}

	exit(): void {
		this.options.onExit?.()
	}
	restart(): void {
		this.startGame()
	}

	pause(): void {
		this.screens.onHostPause(true)
	}

	resume(): void {
		this.screens.onHostPause(false)
	}

	/** Host hook: forward a landed fish to the embedder. */
	handleCatch(event: CatchEvent): void {
		this.options.onCatch?.(event)
	}

	flushProgress(): Promise<void> {
		return this.progressTracker?.flush() ?? Promise.resolve()
	}
}
