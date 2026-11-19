import type { FishTier } from '../types'
import { UI } from './palette'

/** Palette for tier dots, badges and codex tooltips. */
export const TIER_COLOR: Record<FishTier, number> = {
	common: UI.textMuted,
	rare: UI.ice,
	legendary: UI.legendary
}
