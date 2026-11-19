import { fishDescription } from '../../fish'
import { formatWeight } from '../../fishWeight'
import { TEXT, TIER_LABEL } from '../../texts'
import { UI } from '../palette'
import { setText } from '../theme'
import { TIER_COLOR } from '../tier'
import { CodexGrid } from './CodexGrid'
import type { Cell } from './setup'

/**
 * The right half of the split: one entry card for the fish under the pointer
 * (or under the keyboard focus), rebuilt from the progress snapshot.
 *
 * The card is fixed in place and size, so the roster next to it never has to
 * dodge a tooltip. Everything below the name is filled in place; the blurb is
 * the only block that changes height. The blurb is the species notes alone —
 * the temperament was printed in front of them as a separate word, which only
 * repeated what the water-and-tier line already says about the fish.
 */
export class CodexDetails extends CodexGrid {
	protected showFocusedDetails(): void {
		const index = this.focus.currentIndex
		if (index < 0 || index >= this.cells.length) return
		this.showDetails(this.cells[index])
	}

	protected showDetails(cell: Cell): void {
		const entry = this.game.progress.snapshot.fish[cell.fish.id]
		const caught = (entry?.caught ?? 0) > 0
		// In development every entry is readable even before the first catch: the
		// notes and the water/tier line are what the screen is being built around,
		// and a locked card makes them impossible to check without playing the
		// species' window. Only the record stays catch-bound — it reports progress,
		// not the species.
		const revealed = caught || import.meta.env.DEV

		this.portrait.texture = this.game.assets.fish[cell.fish.id]
		// An uncaught species is a silhouette, exactly like its roster cell: the
		// slot behind it is light so the ink shape still reads.
		this.portrait.tint = revealed ? 0xffffff : UI.ink
		this.portrait.alpha = revealed ? 1 : 0.9

		setText(this.detailsName, (revealed ? cell.fish.name : TEXT.codex.unknown).toUpperCase())
		this.detailsName.style.fill = revealed ? UI.text : UI.textMuted

		// The tier and the habits stay hidden until the first catch; the card then
		// shows the unlock hint instead of the species notes. The footer and its
		// rule follow the record: an empty strip would be a stray line. The water
		// body is not named: the fish only ever appears in one of them, and the
		// codex is opened from the water the player is standing on.
		this.detailsType.visible = revealed
		this.detailsRecord.visible = caught
		this.footerRule.visible = caught
		if (revealed) {
			setText(this.detailsType, TIER_LABEL[cell.fish.tier])
			this.detailsType.style.fill = TIER_COLOR[cell.fish.tier]
			setText(this.detailsDesc, fishDescription(cell.fish))
		} else {
			setText(this.detailsDesc, TEXT.codex.locked)
		}
		if (caught && entry) {
			setText(this.detailsRecord, TEXT.codex.record(entry.caught, formatWeight(entry.bestKg)))
		}

		this.markSelection(cell)
	}
}
