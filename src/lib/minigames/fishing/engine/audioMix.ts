/**
 * Audio balance for every cue in the game.
 *
 * Each cue used to carry its gain inline at the call site (`this.play("bite",
 * 0.55)`), which made the mix impossible to hear as a whole and painful to
 * retune: raising the bite meant finding the one line that played it. The gains
 * now live in one table, and the dev panel (`F2`) edits the live mix on top of
 * it, so a balance can be heard and judged frame by frame. Tuned numbers are
 * moved back here by hand: the panel writes to the running `AudioKit`, never to
 * this file.
 */

export type MixGroup = 'interface' | 'fishing' | 'fight' | 'world' | 'ambience'

/**
 * Every fader. The union is written out instead of being derived from
 * {@link MIX_CHANNELS} because the array is typed with it, and a type alias
 * that derives from its own annotation does not compile.
 */
export type MixChannel =
	| 'hover'
	| 'click'
	| 'back'
	| 'cast'
	| 'charge'
	| 'splash'
	| 'plop'
	| 'bite'
	| 'nibble'
	| 'hook'
	| 'reel'
	| 'catchCommon'
	| 'escape'
	| 'warn'
	| 'counter'
	| 'ready'
	| 'landReady'
	| 'resist'
	| 'gripOut'
	| 'objective'
	| 'comboBreak'
	| 'newRecord'
	| 'ambience'
	| 'master'

export interface MixChannelDef {
	id: MixChannel
	group: MixGroup
	/** Short label for the dev panel; the panel is 480 px wide. */
	label: string
}

/** Every fader, in panel order. */
export const MIX_CHANNELS: readonly MixChannelDef[] = [
	{ id: 'hover', group: 'interface', label: 'НАВЕДЕНИЕ' },
	{ id: 'click', group: 'interface', label: 'КЛИК' },
	{ id: 'back', group: 'interface', label: 'НАЗАД' },

	{ id: 'cast', group: 'fishing', label: 'ЗАБРОС' },
	{ id: 'charge', group: 'fishing', label: 'ЗАТЯЖКА' },
	{ id: 'splash', group: 'fishing', label: 'ВСПЛЕСК' },
	{ id: 'plop', group: 'fishing', label: 'ПОПЛАВОК' },
	{ id: 'bite', group: 'fishing', label: 'ПОКЛЕВКА' },
	{ id: 'nibble', group: 'fishing', label: 'ТЫЧОК' },
	{ id: 'hook', group: 'fishing', label: 'ПОДСЕЧКА' },
	{ id: 'reel', group: 'fishing', label: 'КАТУШКА' },
	{ id: 'catchCommon', group: 'fishing', label: 'УЛОВ' },
	{ id: 'escape', group: 'fishing', label: 'СРЫВ' },

	{ id: 'warn', group: 'fight', label: 'РЫВОК' },
	{ id: 'counter', group: 'fight', label: 'КОНТР' },
	{ id: 'ready', group: 'fight', label: 'ГОТОВ' },
	{ id: 'landReady', group: 'fight', label: 'ФИНАЛ' },
	// The perfect cast: the chime that answers a release inside the green band.
	{ id: 'objective', group: 'fight', label: 'ЗОНА' },
	{ id: 'resist', group: 'fight', label: 'ОТПОР' },
	{ id: 'gripOut', group: 'fight', label: 'ХВАТКА' },

	{ id: 'comboBreak', group: 'world', label: 'ОБРЫВ' },
	{ id: 'newRecord', group: 'world', label: 'РЕКОРД' },

	{ id: 'ambience', group: 'ambience', label: 'ЭМБИЕНТ' },
	{ id: 'master', group: 'ambience', label: 'МАСТЕР' }
]

/** Gain of every channel, 0..1. */
export type AudioMix = Record<MixChannel, number>

export const AUDIO_MIX: AudioMix = {
	hover: 0.14,
	click: 0.32,
	back: 0.28,
	cast: 0.4,
	charge: 0.2,
	splash: 0.36,
	plop: 0.23,
	bite: 0.3,
	nibble: 0.24,
	hook: 0.4,
	reel: 0.5,
	catchCommon: 0.4,
	escape: 0.3,
	warn: 0.5,
	counter: 0.42,
	ready: 1,
	landReady: 0.24,
	objective: 1,
	resist: 0.34,
	gripOut: 0.3,
	comboBreak: 0.26,
	newRecord: 0.42,
	ambience: 0.16,
	master: 0.6
}

/** Group titles and order used by the panel. */
export const MIX_GROUPS: readonly { id: MixGroup; label: string }[] = [
	{ id: 'interface', label: 'ИНТЕРФЕЙС' },
	{ id: 'fishing', label: 'РЫБАЛКА' },
	{ id: 'fight', label: 'БОЙ' },
	{ id: 'world', label: 'МИР' },
	{ id: 'ambience', label: 'ЭМБИЕНТ' }
]

/** Clamps a mix to 0..1 and drops unknown keys, so stored data is safe. */
export function normalizeMix(
	source: Partial<Record<string, number>> | null | undefined
): Partial<AudioMix> {
	const mix: Partial<AudioMix> = {}
	if (!source) return mix
	for (const channel of MIX_CHANNELS) {
		const value = source[channel.id]
		if (typeof value !== 'number' || !Number.isFinite(value)) continue
		mix[channel.id] = Math.min(1, Math.max(0, value))
	}
	return mix
}

/** `AUDIO_MIX` overlaid with a stored or partially edited mix. */
export function mixWith(overrides: Partial<AudioMix> | null | undefined): AudioMix {
	return { ...AUDIO_MIX, ...normalizeMix(overrides) }
}

/** Two decimals is finer than the ear can separate in a mix. */
export function formatGain(value: number): string {
	return String(Math.round(value * 100) / 100)
}
