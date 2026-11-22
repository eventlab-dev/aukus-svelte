import type { FishTier } from '../types'
import { UI } from './palette'

/**
 * Palette for tier dots, badges and codex tooltips: muted for the everyday
 * catch, mint above it, ice for the rare band and gold for the mythic trophy.
 */
export const TIER_COLOR: Record<FishTier, number> = {
	common: UI.textMuted,
	uncommon: UI.mint,
	rare: UI.ice,
	mythic: UI.legendary
}
