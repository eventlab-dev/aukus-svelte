import type { MixGroup } from '../../audioMix'
import { UI } from '../palette'

/** Colour of a fader's filled part, per group: the panel reads as one board. */
export const GROUP_COLOR: Record<MixGroup, number> = {
	interface: UI.periwinklePale,
	fishing: UI.ice,
	fight: UI.amber,
	world: UI.legendary,
	ambience: UI.teal
}

/** Panel geometry, all in the 480×270 virtual frame. */
export const PANEL = { x: 16, y: 6, width: 448, height: 258 }
export const COLUMN = { width: 176, gap: 22 }
export const ROW = {
	height: 10,
	/** Width of the audition button sitting left of the name. */
	play: 10,
	gap: 3,
	name: 47,
	track: 88,
	/** Readout column right of the fader. */
	value: 24
}
/** x of the fader start, the name start and the readout's right edge. */
export const NAME_X = ROW.play + ROW.gap
export const TRACK_X = NAME_X + ROW.name
export const ROW_END = TRACK_X + ROW.track + ROW.value
export const HEADER = 12
export const LIST_TOP = 38
