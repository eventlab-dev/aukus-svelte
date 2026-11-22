import {
	fishDescription,
	formatFlaw,
	formatPearlSize,
	lowEnd,
	PEARLS,
	pearlBand,
	pearlDemoSpec,
	pearlScale
} from '../../fish'
import { formatWeight } from '../../fishWeight'
import { PLATINUM } from '../../config'
import { PEARL_TEXT, TEXT, TIER_LABEL } from '../../texts'
import type { FishProgress, PearlProgress } from '../../types'
import { UI } from '../palette'
import { setText } from '../theme'
import { TIER_COLOR } from '../tier'
import type { FooterRow } from './CodexBase'
import { CodexGrid } from './CodexGrid'
import type { Cell, FishCell, PearlCell } from './setup'

/**
 * The right half of the split: one entry card for the fish or pearl under the
 * pointer (or under the keyboard focus), rebuilt from the progress snapshot.
 *
 * The card is fixed in place and size, so the roster next to it never has to
 * dodge a tooltip. The header is two columns — the sprite's well beside the name
 * and the rarity — and under the species blurb the footer lists the entry's
 * stats, one per row: both ends of the weight against the species' own bounds
 * and the catch tally against its class' platinum target.
 *
 * Pearls reuse the same card: the header, the band in the rarity slot, the pearl
 * blurb and its own rows — the flaw index, the size against the variety's
 * largest specimen, and the finds. An uncaught pearl is still a silhouette,
 * exactly like an uncaught fish.
 */
export class CodexDetails extends CodexGrid {
	protected showFocusedDetails(): void {
		const index = this.focus.currentIndex
		if (index < 0 || index >= this.cells.length) return
		this.showDetails(this.cells[index])
	}

	protected showDetails(cell: Cell): void {
		if (cell.kind === 'pearl') {
			this.showPearlDetails(cell)
			return
		}
		this.showFishDetails(cell)
	}

	private showFishDetails(cell: FishCell): void {
		const entry = this.fishEntry(cell.fish)
		const caught = (entry?.caught ?? 0) > 0
		// In development every entry is readable even before the first catch: the
		// notes and the tier are what the screen is being built around, and a
		// locked card makes them impossible to check without playing the species'
		// window. Only the stats stay catch-bound — they report progress, not the
		// species.
		const revealed = caught || import.meta.env.DEV

		this.portrait.visible = true
		this.portrait.texture = this.game.assets.fish[cell.fish.id]
		// An uncaught species is a silhouette, exactly like its roster cell: the
		// well behind it is light so the ink shape still reads.
		this.portrait.tint = revealed ? 0xffffff : UI.ink
		this.portrait.alpha = revealed ? 1 : 0.9
		this.portrait.scale.set(2.4)
		// The card shows the sprite as drawn, with no coat: the shine belongs to
		// the roster, where every slot is a specimen of its own. Here the card is
		// about the record — the weights, the tally and the blurb — and the rainbow
		// running over the portrait would be an effect on top of a reading. Pearls
		// follow the same rule.
		this.syncPortraitShadow(revealed)

		setText(this.detailsName, (revealed ? cell.fish.name : TEXT.codex.unknown).toUpperCase())
		this.detailsName.style.fill = revealed ? UI.text : UI.textMuted

		// The tier and the habits stay hidden until the first catch; the card then
		// shows the unlock hint instead of the species notes. The footer and its
		// rule follow the stats: an empty block would be a stray line. The water
		// body is not named here: a fish lives in one body only.
		this.detailsType.visible = revealed
		if (revealed) {
			setText(this.detailsType, TIER_LABEL[cell.fish.tier])
			this.detailsType.style.fill = TIER_COLOR[cell.fish.tier]
			setText(this.detailsDesc, fishDescription(cell.fish))
		} else {
			setText(this.detailsDesc, TEXT.codex.locked)
		}

		this.setFooter(caught && entry ? this.fishRows(cell, entry) : [])
		this.markSelection(cell)
	}

	/**
	 * The fish rows: each weight against the species' own bound and the tally
	 * against its class' platinum target. The labels stay muted and the numbers
	 * carry the row — the eye scans for values, and the words only say what they
	 * measure.
	 */
	private fishRows(cell: FishCell, entry: FishProgress): FooterRow[] {
		const [floor, ceiling] = cell.fish.weightKg
		return [
			{
				label: TEXT.codex.weightLowLabel,
				value: TEXT.codex.weightLowValue(formatWeight(lowEnd(entry)), formatWeight(floor))
			},
			{
				label: TEXT.codex.weightHighLabel,
				value: TEXT.codex.weightHighValue(formatWeight(entry.bestKg), formatWeight(ceiling))
			},
			{
				label: TEXT.codex.caughtLabel,
				value: TEXT.codex.caughtValue(entry.caught, PLATINUM.catches[cell.fish.tier])
			}
		]
	}

	private showPearlDetails(cell: PearlCell): void {
		const entry = this.game.progress.snapshot.pearls[cell.pearl.id]
		const caught = (entry?.caught ?? 0) > 0
		const revealed = caught || import.meta.env.DEV
		const specimen = caught && entry ? entry.best : pearlDemoSpec(PEARLS.indexOf(cell.pearl))

		// The card shows the sprite as drawn, with no shader: the shine belongs to
		// the roster, where every slot is a specimen of its own and the flop of the
		// index has to be readable at a glance. Here the card is about the record —
		// the best index, the size, the blurb — and a sweep running over the still
		// would be an effect on top of a reading, not a reading.
		this.portrait.visible = true
		this.portrait.texture = this.game.assets.pearls[cell.pearl.id]
		this.portrait.tint = revealed ? 0xffffff : UI.ink
		this.portrait.alpha = revealed ? 1 : 0.9
		// A larger specimen gets a larger portrait, like the catch does. A locked
		// pearl is a silhouette: it takes the largest portrait scale, the same one
		// an uncaught fish uses, so it fills the well without spilling over it and
		// never hints at the size of a specimen that has not been found.
		this.portrait.scale.set(revealed ? 0.675 + pearlScale(specimen.sizeMm) : 2.4)
		this.syncPortraitShadow(revealed)

		setText(this.detailsName, (revealed ? cell.pearl.name : TEXT.codex.unknown).toUpperCase())
		this.detailsName.style.fill = revealed ? UI.text : UI.textMuted
		this.detailsType.visible = revealed

		if (revealed) {
			setText(this.detailsType, TEXT.codex.pearlType(pearlBand(specimen.float).label))
			this.detailsType.style.fill = TIER_COLOR.mythic
			setText(this.detailsDesc, PEARL_TEXT[cell.pearl.id].desc)
		} else {
			setText(this.detailsDesc, TEXT.codex.pearlLocked)
		}

		this.setFooter(caught && entry ? this.pearlRows(cell, entry) : [])
		this.markSelection(cell)
	}

	/**
	 * The pearl rows, in the same shape as a fish's: the flaw index with the rule
	 * it obeys, the best specimen's size against the variety's largest, and the
	 * finds. A pearl has no coat and no platinum target, so it stops at three.
	 */
	private pearlRows(cell: PearlCell, entry: PearlProgress): FooterRow[] {
		return [
			{ label: TEXT.codex.pearlIndexLabel, value: formatFlaw(entry.best.float) },
			{
				label: TEXT.codex.pearlSizeLabel,
				value: TEXT.codex.pearlSizeValue(
					formatPearlSize(entry.best.sizeMm),
					formatPearlSize(cell.pearl.sizeMm[1])
				)
			},
			{ label: TEXT.codex.pearlFoundLabel, value: String(entry.caught) }
		]
	}
}
