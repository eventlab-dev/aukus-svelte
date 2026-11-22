import type { AreaId, WeatherId } from '../types'

/**
 * Curated Stardew Valley cues, flattened into `assets/fishing/sounds`.
 * Ambient loops are started through the same Web Audio graph so muting and
 * page visibility keep working without extra DOM audio elements.
 *
 * Every gain comes from `AUDIO_MIX` (see `audioMix.ts`) rather than from the
 * call site: the dev panel edits that table live and can write it back.
 */
export const SOUND_FILES = {
	select: 'select.wav',
	button: 'button.wav',
	cancel: 'cancel.wav',
	blip1: 'blip1.wav',
	cast: 'cast.wav',
	waterScoop: 'water-scoop.wav',
	bob: 'bob.wav',
	bite: 'bite.wav',
	fishHit: 'fish-hit.wav',
	escape: 'escape.wav',
	reel: 'reel.wav',
	waterLap: 'water-lap.wav',
	reward: 'reward.wav',
	lineSnap: 'line-snap.wav',
	shiny: 'shiny.wav',
	crit: 'crit.wav',
	objective: 'objective-complete.wav',
	thud: 'thud.wav',
	newRecord: 'new-record.wav',
	ambBrook: 'amb-brook.wav',
	ambPool: 'amb-pool.wav',
	ambOcean: 'amb-ocean.wav',
	ambWinter: 'amb-winter.wav',
	ambFrost: 'amb-frost.wav'
} as const

export type SoundName = keyof typeof SOUND_FILES

/**
 * Interface cues are the only sounds a menu can make, so they are the only
 * ones fetched on the first gesture. Loading the whole pack there used to
 * download ~6 MB before the player had even started a round.
 */
export const UI_CUES: readonly SoundName[] = ['select', 'button', 'cancel', 'blip1']

/** Everything the cast/fight flow can trigger; fetched when a round starts. */
export const ROUND_CUES: readonly SoundName[] = [
	'cast',
	'waterScoop',
	'bob',
	'bite',
	'fishHit',
	'escape',
	'reel',
	'waterLap',
	'reward',
	'lineSnap',
	'shiny',
	'crit',
	'objective',
	'thud',
	'newRecord'
]

/**
 * A looping ambience bed. `rate` picks the pace, `cutoff` darkens the source
 * and `level` normalizes its loudness.
 *
 * The Stardew ambience files are not mixed to a common reference: the brook
 * measures 0.005 RMS, the pool and the ocean 0.032–0.034, so playing them all
 * at the same gain would make the lake bed seven times louder than the river.
 * `level` is the trim that brings each one to the brook's own level, so the
 * `ambience` fader means the same thing in every location.
 */
export interface BedDef {
	file: SoundName
	rate: number
	level: number
	/** Low-pass cutoff in Hz; a still lake or thick fog is darker than a river. */
	cutoff?: number
}

/**
 * One water bed per water body. A single brook loop for all three locations
 * was the original sound of the lake and the sea as well, and a rushing stream
 * under still water reads as a waterfall behind the picture. The lake now laps
 * slowly, the river runs and the sea swells.
 */
export const WATER_BED_BY_AREA: Record<AreaId, BedDef> = {
	// Still water: the pool's lazy laps, slowed and low-passed until the surface
	// barely moves.
	deep: { file: 'ambPool', rate: 0.8, level: 0.15, cutoff: 900 },
	// The reference bed: a shallow, quick stream.
	rapids: { file: 'ambBrook', rate: 1, level: 1 },
	// Open sea: long waves, full-range but a touch slower than the source.
	cove: { file: 'ambOcean', rate: 0.95, level: 0.16, cutoff: 5000 }
}

/**
 * One bed per weather front, layered under the water. A frozen lake has no
 * rain or thunder in it, so the fronts are told by wind and air: bare winter
 * air when the sky is clear, a cold wind that thickens with the snowfall, and
 * a mute, low-passed wind in fog.
 */
export const WEATHER_BED: Record<WeatherId, BedDef> = {
	clear: { file: 'ambWinter', rate: 1, level: 0.7 },
	overcast: { file: 'ambFrost', rate: 0.85, level: 0.06, cutoff: 1500 },
	snow: { file: 'ambFrost', rate: 0.95, level: 0.09, cutoff: 3000 },
	blizzard: { file: 'ambFrost', rate: 1.08, level: 0.16 },
	fog: { file: 'ambFrost', rate: 0.68, level: 0.05, cutoff: 700 },
	// The aurora is a still, silent night: the darkest and quietest bed there is,
	// so the ribbons are the only thing moving on screen.
	aurora: { file: 'ambFrost', rate: 0.55, level: 0.035, cutoff: 520 }
}

/**
 * The reel is a sustain, not a one-shot: while the player holds the line the
 * sample loops instead of retriggering, because overlapping copies of a
 * one-second texture detune against each other and read as the sound
 * "doubling".
 *
 * `[REEL_LOOP_START, REEL_LOOP_END]` is the part of `reel.wav` that joins on
 * itself: both edges land in the pause between two ratchet clicks (measured RMS
 * 0.002 and peak under 0.01 either side), so the seam sits below the sample's
 * own bite-to-bite jitter and the loop does not pulse once per revolution. The
 * window is deliberately longer than the old 0.28 s one: the source spins up
 * from 30 ms clicks to 13 ms ones, so a wider slice spreads that drift over a
 * longer stretch instead of repeating a two-click tic.
 *
 * The rate carries both pitch and tempo: one `playbackRate` cannot lift the
 * crank's note without also spinning the ratchet faster. At 1.0 the reel sits
 * at the sample's own pitch — a semitone and a half above the slowed take that
 * came before it — while still turning slower than the pack's 1.15, and the
 * loop below is long enough that the faster cadence does not read as a tic.
 */
export const REEL_LOOP_START = 0.34
export const REEL_LOOP_END = 0.663
export const REEL_RATE = 1.0
/** Fade on the loop edges so holding and releasing the line never clicks. */
export const REEL_FADE = 0.06
/**
 * Grip share under which the crank starts to strain, and how much faster it
 * turns when the grip is gone.
 *
 * The angler's grip is the fight's countdown: the last third is the part where
 * the line is nearly out of hand. Lifting the crank's rate across exactly that
 * stretch turns the loop into a warning — the ear hears the reel climbing
 * before the bar on screen has been read. A quarter faster is enough to feel
 * like strain without the ratchet turning into a buzz.
 */
export const REEL_STRAIN_FLOOR = 0.3
export const REEL_STRAIN_PITCH = 0.24

/**
 * Charge wind-up. The old charge looped a slice of `cast.wav`; the whoosh is
 * an impact, not a texture, so the seam and the sample's own noise made the
 * held note pulse and buzz. The wind-up is now synthesized: a two-second noise
 * buffer (seamless by nature) runs through a band-pass, and the band climbs as
 * the meter fills. A filter opening over noise reads as air being pulled past
 * the rod instead of an interface beep, and it can be held for as long as the
 * meter is pumped without ever repeating an envelope.
 */
export const CHARGE_NOISE_SECONDS = 2
export const CHARGE_FILTER_MIN = 520
export const CHARGE_FILTER_MAX = 2100
export const CHARGE_FILTER_Q = 1.1
/**
 * Low cut under the wind-up, in Hz.
 *
 * The band-pass alone is a wide bell (Q 1.1 at 520 Hz passes everything down to
 * roughly 285 Hz), and all of that bottom end is rumble: a held note with a
 * fuzzy low hum under it, which is the part the ear finds tiring on a
 * two-second charge. A gentle 12 dB/octave high-pass takes the rumble out and
 * leaves the airy band the cue is made of: measured on the rendered chain it
 * drops the energy below 250 Hz by about 4 dB while the cue's overall level
 * stays put.
 */
export const CHARGE_HIGHPASS = 500
export const CHARGE_HIGHPASS_Q = 0.8
/** Quietest end of the wind-up, as a share of the channel's peak gain. */
export const CHARGE_MIN_RATIO = 0.55
export const CHARGE_FADE = 0.05

/**
 * Silent lead-in a cue may keep, in seconds, and how much of it is handed back
 * so the attack is not chopped. See `trimLeadIn`.
 */
export const LEAD_IN_LIMIT = 0.05
export const LEAD_IN_KEEP = 0.012
/** Level that counts as the start of the sound, relative to the cue's peak. */
export const LEAD_IN_GATE = 0.02
/**
 * A lone sample over the gate is a tick, not an onset (the cast cue has one):
 * the sound counts as started once two hits land inside this window, in
 * seconds.
 */
export const LEAD_IN_WINDOW = 0.01
/**
 * Overlap between the wind-up and the throw, in seconds.
 *
 * Releasing the cast used to stop the wind-up on the same frame the whoosh
 * started, so the air being pulled past the rod was cut off under a sound that
 * began at full level: two edits, heard as one click. The wind-up now fades out
 * while the throw has already begun, and it closes its band on the way down, so
 * the air falls away under the whoosh instead of stopping at full pitch.
 */
export const CAST_BLEND = 0.22
