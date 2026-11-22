import { FIGHT } from '../../config'
import type { FishTier } from '../../types'
import { clamp } from '../../utils'
import { FIGHT_RADIUS } from './constants'
import type { FightState } from './state'

/**
 * Extra last-run pressure by rarity class: a spent trophy makes one more dash
 * than a spent roach, and the player has to read it before the landing.
 */
const LAST_RUN_BY_TIER: Record<FishTier, number> = {
	common: 0,
	uncommon: 0.03,
	rare: 0.07,
	mythic: 0.15
}

/** Grip and endurance: the two resources the ring fight is actually about. */
export class FightStamina {
	constructor(private readonly state: FightState) {}

	updateGrip(step: number, steering: boolean): void {
		const s = this.state
		if (s.gripLock > 0) {
			s.gripLock = Math.max(0, s.gripLock - step)
			s.grip = clamp(s.grip + FIGHT.gripRegen * 1.2 * step)
			if (s.gripLock === 0) {
				s.grip = Math.max(s.grip, FIGHT.gripRestore)
			}
			return
		}

		if (steering) {
			// Fighting the weight of the catch spends the angler's grip: a heavy fish
			// is a heavier line to hold, so every second of pull costs more.
			s.grip -= FIGHT.gripDrain * s.load.grip * (s.advantage > 0 ? FIGHT.advantageGrip : 1) * step
			if (s.grip <= 0) {
				s.grip = 0
				s.gripLock = FIGHT.gripLock
				s.onGripOut?.()
			}
		} else {
			s.grip = clamp(s.grip + FIGHT.gripRegen * step)
		}
	}

	updateEndurance(step: number, pull: { x: number; y: number } | null): void {
		const s = this.state
		// Burning the whole grip gives the fish a real breather; holding until
		// lockout can no longer out-tire a careful pulse.
		if (s.gripLock > 0) {
			s.endurance = clamp(s.endurance + FIGHT.lockRecovery * step)
			return
		}

		const inside = Math.hypot(s.fishX, s.fishY) <= FIGHT_RADIUS
		if (pull) {
			// Pulling against the fish's own movement tires it noticeably faster
			// than a lazy radial tug; aiming at the run is part of the fight.
			const speed = Math.hypot(s.vx, s.vy)
			let alignment = 1
			if (speed > 8) {
				alignment = clamp(-(pull.x * s.vx + pull.y * s.vy) / speed, 0, 1)
			}
			const aim = FIGHT.tireAimBase + FIGHT.tireAimGain * alignment
			const rate = FIGHT.tireBase - s.fish.resistance * FIGHT.tireScale
			// A heavy fish spends its endurance more slowly — it has more mass to
			// fight with — so tiring a record catch out is a longer job.
			const tire = rate * s.load.tire * (inside ? 1 : 0.3) * s.tirePower * aim
			const bonus = s.advantage > 0 ? FIGHT.advantageTire : 1
			s.endurance = clamp(s.endurance - tire * bonus * step)
			return
		}

		// The fish catches its breath while the player rests inside the circle.
		if (inside) {
			s.endurance = clamp(s.endurance + s.recoveryRate * s.recoveryPower * step)
		}
	}

	maybeDesperate(): void {
		const s = this.state
		if (s.lastRunRolled) return
		if (s.endurance > FIGHT.lastRunThreshold) return
		s.lastRunRolled = true
		const chance =
			FIGHT.lastRunChance +
			(s.temperament === 'aggressive' ? 0.2 : s.temperament === 'stubborn' ? 0.15 : 0) +
			LAST_RUN_BY_TIER[s.fish.tier]
		if (Math.random() < chance) s.lastRunPending = true
	}

	/**
	 * Refreshes the landing window. Returns true when the fish is fully spent and
	 * inside the ring, so the model can land it on the same frame.
	 */
	updateReady(): boolean {
		const s = this.state
		const inside = Math.hypot(s.fishX, s.fishY) <= FIGHT_RADIUS
		const readyNow = s.endurance <= FIGHT.landThreshold && inside
		if (readyNow && !s.ready && s.elapsed - s.lastReadyChime >= FIGHT.readyChime) {
			s.lastReadyChime = s.elapsed
			s.onReady?.()
		}
		s.ready = readyNow

		// A fish at exactly zero endurance is landed automatically; the manual
		// final pull remains available from the landing threshold.
		return s.endurance === 0 && inside
	}
}
