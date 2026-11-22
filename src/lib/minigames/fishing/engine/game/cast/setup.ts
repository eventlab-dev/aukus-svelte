import type { Container } from 'pixi.js'
import type { GameContext } from '../../GameContext'
import type { AreaDef } from '../../areas'
import { type FishSpecies } from '../../config'
import type { FishingScene } from '../scenes/FishingScene'
import type { JuiceFx } from '../JuiceFx'
import type { FightFocus } from '../FightFocus'
import type { FloaterLayer } from '../../ui/FloaterLayer'

export type CastPhase = 'idle' | 'charging' | 'waiting' | 'bite' | 'fighting' | 'resolve'

export const PULL_KEYS = {
	ArrowLeft: [-1, 0],
	KeyA: [-1, 0],
	ArrowRight: [1, 0],
	KeyD: [1, 0],
	ArrowUp: [0, -1],
	KeyW: [0, -1],
	ArrowDown: [0, 1],
	KeyS: [0, 1]
} as const

export type PullKey = keyof typeof PULL_KEYS

export const PRIMARY_KEYS = new Set(['Space', 'Enter', 'NumpadEnter', 'ArrowUp'])

/**
 * Gap between the top of the landed catch and its name tag.
 *
 * "Top of the catch" is the top of the sunburst around the fish, not the top of
 * the sprite: the tag is taller than the fish is wide, and pinned to the sprite
 * it sat down inside the rays.
 */
export const CATCH_LABEL_GAP = 4

/**
 * Camera knock of the hook strike, by rarity.
 *
 * The take of the bait is the reference knock (1). The strike that sets the
 * hook is the moment the weight on the other end answers, so it scales with
 * what was hooked: a common fish barely moves the frame, a mythic one rattles
 * it, and the player can feel what they are fighting before the fight screen
 * has drawn anything.
 */
export const HOOK_SHAKE: Record<FishSpecies['tier'], number> = {
	common: 0.7,
	uncommon: 0.9,
	rare: 1.15,
	mythic: 1.8
}

export interface CastFlowDeps {
	game: GameContext
	area: AreaDef
	scene: FishingScene
	juice: JuiceFx
	floaters: FloaterLayer
	/** Layer that hosts the fight minigame. */
	fightLayer: Container
	/** Layer that lifts the float above the fight. */
	bobberLayer: Container
	/** Layer for the stamina bars, above the weather. */
	barsLayer: Container
	focus: FightFocus
}
