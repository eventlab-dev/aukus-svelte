import type { FishTier, Temperament, WeatherId } from './types'

/** Virtual resolution — every screen is laid out in these units. */
export const VIEW = { width: 480, height: 270 } as const

/** Ring-fight tuning: grip budget, counters and the landing strike. */
export const FIGHT = {
	/** Endurance is 0..1; at or below this the fish can be landed. */
	landThreshold: 0.2,
	/** Grip is 0..1: holding a pull drains it, releasing restores it. */
	gripDrain: 0.31,
	gripRegen: 0.46,
	/** Lockout after burning the whole grip, then a small reserve. */
	gripLock: 1.8,
	gripRestore: 0.3,
	/** The fish catches its breath while the angler is out of grip. */
	lockRecovery: 0.18,
	/** Endurance the fish regains while it is not being pulled. */
	recoveryBase: 0.04,
	recoveryScale: 0.04,
	/**
	 * How long the counter stays restable. The window itself is the zone's own
	 * paint time (`zoneTuning.truthTime`): a press counts while the band is drawn.
	 */
	counterRest: 0.15,
	/**
	 * The counter is a gesture, not a second aim: the player presses on the dash
	 * side of the ring and drags toward the middle of it. The wedge's shape and
	 * its half-angle live in `game/fight/zoneTuning.ts`, because the view draws
	 * the very same numbers the model tests. `counterDrag` is how far the drag has
	 * to travel before it counts.
	 *
	 * Aiming against the run with the button already held is not a gesture: the
	 * press has to land on the dash side, which is what makes the move read as
	 * "catch the dash by its tail" instead of "always pull the other way". The
	 * press may be prepared while the zone is up: a button put down in the wedge
	 * before the window already arms the grab.
	 */
	counterGrab: 10,
	counterDrag: 9,
	/** A successful counter cancels the burst and leaves the fish briefly stunned. */
	counterStun: 0.35,
	counterAngle: Math.PI / 4,
	advantage: 1,
	advantageTire: 1.5,
	advantageGrip: 0.75,
	/** Endurance loss per second while pulling. */
	tireBase: 0.33,
	tireScale: 0.3,
	/**
	 * A feinting strong dash first lunges toward the false warning for this long,
	 * then reverses toward the true heading.
	 */
	feintDelay: 0.16,
	/** Power of the false lunge before the reversal. */
	feintPower: 0.55,
	/** The false warning points this far off the true heading, in radians. */
	feintAngleMin: 1.1,
	feintAngleMax: 1.5,
	/**
	 * How much the caught weight swings the fight, away from the middle of the
	 * species range. At the top of the range the fish comes in `weightPull`
	 * slower, drains `weightGrip` more of the angler's grip and spends
	 * `weightTire` less of its endurance per second; at the bottom of the range
	 * the same amounts go the other way. The values are shares of the base
	 * rate, so the middle of the range is exactly neutral.
	 */
	weightPull: 0.15,
	weightGrip: 0.18,
	weightTire: 0.15,
	/**
	 * How much the species' own mean weight slows the pull, per kilo.
	 *
	 * The range share above only separates two catches of the same species. This
	 * is the other half of "the lighter the fish, the quicker it comes in": it
	 * divides the pull by `sqrt(1 + meanKg * massPull)`, so a minnow of a few
	 * hundred grams is reeled at almost full speed, a 5 kg pike at ~0.9 and a
	 * 50 kg halibut at ~0.55. The square root keeps the heavy end tiring without
	 * turning the fight into a mule.
	 */
	massPull: 0.05,
	/** Tiring is stronger when the pull opposes the fish's movement. */
	tireAimBase: 0.45,
	tireAimGain: 0.55,
	/** Escape meter: how much a pull slows it, and counterplay swings. */
	escapePullFactor: 0.55,
	/**
	 * A missed strong dash and a landed counter are shares of the escape meter,
	 * not seconds. Half the meter per miss makes the rule temperament-proof:
	 * two missed dashes always tear the fish free, and a counter refunds most of
	 * one miss, so a miss followed by a read is survivable.
	 */
	uncounteredBurst: 0.5,
	counterRelief: 0.45,
	/** Meter recovered per second while the fish is back inside the circle. */
	escapeRecover: 0.06,
	/**
	 * A miss freezes the inside recovery for this long, so the meter cannot be
	 * healed away between two dashes: two misses in a row always add up.
	 */
	escapeLockTime: 2.5,
	/**
	 * How long a missed dash's share of the meter takes to pour in. The miss is
	 * paid in full, but the clock climbs over this window instead of jumping:
	 * the срыв bar paints the unpaid share as a dimmer segment ahead of the
	 * solid block, so an instant half-bar jump would read as a bug instead of
	 * a mistake being paid for.
	 */
	missFillTime: 1.5,
	/**
	 * No dash may start in the opening beat of a fight: the fish only circles for
	 * this long, so the first burst never lands on a player who is still reading
	 * the ring and the two gauges. A dash that would have started inside the
	 * grace is deferred, not skipped — the authored script keeps its order.
	 */
	startGrace: 1.2,
	/** A final pull attempted too early. */
	resistEndurance: 0.05,
	resistGrip: 0.08,
	resistCooldown: 0.5,
	/** Reactions to pressure. */
	sameAimTime: 2.5,
	/** Escaping the ring: how quickly a neglected fish aims for the edge. */
	neglectRamp: 1.1,
	/**
	 * How fast a held line unwinds the neglect clock. It is deliberately slower
	 * than real time: a single tapped frame must not reset the drift, otherwise
	 * "resting" could be faked with one click per second.
	 */
	neglectRecover: 3,
	/** Extra ring radii the fish aims for once it is fully neglected. */
	neglectPush: 0.32,
	lowGrip: 0.25,
	lastRunThreshold: 0.3,
	lastRunChance: 0.3,
	/** Minimum gap between landing chimes. */
	readyChime: 0.9,
	/**
	 * Hard ceiling on one fight, in seconds. Every real fight ends well inside
	 * it, so this only catches a soft-lock: a fight that neither player nor fish
	 * can finish (for example, input that keeps the fish circling but never
	 * tires it). At the limit the fish tears off.
	 */
	timeLimit: 90
} as const

export type { Temperament } from './types'

/**
 * Per-catch temperament. `tempo` > 1 shortens move durations, `run` scales the
 * burst power, `tire` scales how fast endurance drops, `recovery` scales how
 * fast it comes back, `feint` is the chance of a misdirection, `escape`
 * lengthens or shortens the outside timer.
 */
export const TEMPERAMENTS: Record<
	Temperament,
	{
		tempo: number
		run: number
		tire: number
		recovery: number
		feint: number
		escape: number
	}
> = {
	calm: {
		tempo: 0.82,
		run: 0.94,
		tire: 1.08,
		recovery: 1.15,
		feint: 0.15,
		escape: 1.08
	},
	aggressive: {
		tempo: 1.14,
		run: 1.1,
		tire: 0.95,
		recovery: 0.9,
		feint: 0.35,
		escape: 0.95
	},
	skittish: {
		tempo: 1.08,
		run: 0.98,
		tire: 1,
		recovery: 1,
		feint: 0.55,
		escape: 0.9
	},
	stubborn: {
		tempo: 0.92,
		run: 1.04,
		tire: 0.86,
		recovery: 0.82,
		feint: 0.2,
		escape: 1.15
	}
}

/**
 * Rosy-42 (+3 blues) palette used by the Tiny Coast Pack.
 *
 * These colours belong to the painted world — scenes, props, fish and effects.
 * The interface chrome has its own palette in `ui/palette.ts` (indigo,
 * periwinkle, ice) and must not borrow art tokens.
 */
export const C = {
	ink: 0x14182e,
	night: 0x1b1f21,
	deep: 0x124e89,
	panel: 0x2b2b45,
	panelAlt: 0x3a3f5e,
	steel: 0x4c6885,
	steelLight: 0x686f99,
	steelPale: 0xa3a7c2,
	cream: 0xf5ffe8,
	white: 0xdfe0e8,
	gold: 0xf0b541,
	yellow: 0xffee83,
	orange: 0xff8933,
	red: 0xe64539,
	/**
	 * Violet used only by the feint telegraph. It has to be unmistakably *not*
	 * red and *not* orange at a glance on dark water — `magenta` is a dark
	 * raspberry that reads as red at 13 px, which is the one thing this colour
	 * must never do.
	 */
	purple: 0xa96fe6,
	redDark: 0x9c2a70,
	green: 0x63ab3f,
	greenDark: 0x3b7d4f,
	teal: 0x2f5753,
	blue: 0x0095e9,
	cyan: 0x2ce8f5,
	navy: 0x124e89,
	brown: 0xab5130,
	brownDark: 0x7d3833,
	brownLight: 0xcf752b,
	sand: 0xf0b541,
	skin: 0xffae70,
	magenta: 0x9c2a70,
	ocean: 0x0a6cb0
} as const

export type { FishSpecies } from './fish'
export {
	FISH,
	FISH_BY_ID,
	fishDescription,
	fishInArea,
	fullWeatherLabel,
	fullWindowLabel,
	isAboveCommon,
	isFishInWindow,
	validateFishData
} from './fish'

/**
 * Luck zone on the cast bar. Its centre is re-rolled for every cast, so the
 * player has to read the bar instead of memorising one perfect release.
 */
export const LUCK_BAND = { min: 0.5, max: 0.92, width: 0.11 } as const

/**
 * Rare-fish weight multiplier after landing inside the luck zone. This is a
 * nudge, not a jackpot: the zone is one of several small inputs into the roll.
 */
export const LUCK_ZONE_MULT = 1.4

/**
 * The luck zone on the shiny roll. The colourway is a per-catch lottery whose
 * base odds are set by the rarity class (`TIER_SHINY`), so a cast inside the
 * zone doubles them instead of nudging them.
 */
export const LUCK_ZONE_SHINY = 2

/**
 * A release this soon after leaving the zone still counts. It absorbs input
 * latency and the last frame of travel without visibly widening the band.
 */
export const LUCK_RELEASE_BUFFER = 0.07

/** Chance that a fish swims past without biting. */
export const PASS_BY_CHANCE = 0.12

/**
 * Reaching for the tired fish with the pointer.
 *
 * `radius` is how close the press has to land to the fish to become a landing
 * attempt, `release` how far the finger may travel between the press and the
 * release before the attempt is dropped (a scroll, a drag of the line).
 */
export const TAP_REACH = { radius: 20, release: 22 } as const

/**
 * The same reach for a finger: a fingertip is about 9 mm wide, which on a phone
 * frame is nearly twice the cursor's box, and a landing the player aimed at but
 * missed by two pixels reads as the game refusing the catch.
 */
export const TOUCH_TAP_REACH = { radius: 30, release: 32 } as const

/** Short beat after spooking a fish, before the next cast is allowed. */
export const SPOOK_HOLD = 0.95

/**
 * The shell catch. The shell can bite on every water body; the reveal is the
 * payoff, so it gets its own, longer hold: charge, split, pearl entrance.
 */
export const PEARL = {
	/**
	 * Share of bites that offer a shell, on every water body. Rare on purpose:
	 * the shell is the whole pearl set's only door, so one bite in a hundred is
	 * the rate the set is tuned around.
	 */
	shellChance: 0.01,
	/** Shell trembles and gathers light. */
	chargeTime: 0.85,
	/** Flash, shell halves fly apart, pearl starts to grow. */
	splitTime: 0.5,
	/** Pearl scales from nothing to its resting size. */
	pearlInTime: 0.45,
	/** Seconds after the landing when the name tag may appear. */
	revealLead: 1,
	/** Longer than a fish hold: the reveal is the content, not a transition. */
	resultHold: 4.8
} as const

/**
 * The shiny colourway: a rare variant of any fish, rendered by a rainbow shade
 * rather than an extra sprite (`game/shinyShader.ts`).
 *
 * It is a per-catch roll, not a per-species trait, so two catches of the same
 * species can be a plain and a shiny one. The chance belongs to the rarity
 * class (`TIER_SHINY` in `fish/tiers.ts`), and the luck zone doubles the roll
 * — the cast's one skill window is the only thing that tilts the table.
 */

/**
 * The platinum frame of a codex species: the completion mark of one entry.
 *
 * Two conditions, both about the species itself: a tally of catches and both
 * ends of its weight (a heaviest and a lightest specimen, not the same fish
 * twice). The tally is per class because the classes differ by two orders of
 * magnitude in bite rate — a flat hundred is a couple of hours on a roach and a
 * lifetime on a koi. Nothing about the frame changes the catch; it only changes
 * how the well is framed.
 */
export const PLATINUM: { readonly catches: Readonly<Record<FishTier, number>> } = {
	/** Catches of one species needed for its platinum frame, by class. */
	catches: {
		common: 100,
		uncommon: 30,
		rare: 10,
		mythic: 2
	}
}

export const TIMING = {
	chargeCycle: 0.85,
	castFlight: 0.5,
	resultHold: 3,
	catchCrossfade: 0.35,
	/**
	 * How long the landed fish takes to arc from the float into the angler's
	 * hands. The catch name tag waits for it: a caption over a fish that is still
	 * travelling reads as if the lake caught it mid-air.
	 */
	catchJump: 0.62,
	escapedHold: 1.35,
	/** Random pause between the cast landing and the bite. */
	waitMin: 2.4,
	waitMax: 5,
	/** Random lead time before the bite when the bobber starts twitching. */
	nibbleLeadMin: 0.5,
	nibbleLeadMax: 0.9,
	nibbleDuration: 0.34,
	/** Warning window before a strong fish dash. */
	telegraph: 0.5
} as const

export type { WeatherId }
