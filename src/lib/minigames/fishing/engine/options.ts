import { AREAS } from './areas'
import type { AreaId, FishingGameOptions, NormalizedOptions } from './types'

/**
 * Resolves defaults that depend on the bundler (`import.meta.env`). Kept out
 * of `types.ts` so headless tools can compile the data layer without Vite.
 */
export function normalizeOptions(options: FishingGameOptions): NormalizedOptions {
	// `BASE_URL` is relative (`./`) in a SvelteKit build, so a host that mounts
	// the game on a nested route passes `publicBase` explicitly. Everything the
	// engine loads — art, cursors, the frost veil — hangs off this one root.
	const publicBase = (options.publicBase ?? `${import.meta.env.BASE_URL}assets`).replace(/\/+$/, '')
	const base = (options.assetBase ?? `${publicBase}/fishing`).replace(/\/+$/, '')
	const locations = { cove: true, deep: true, rapids: true } as Record<AreaId, boolean>
	// Only an explicit `false` closes a location: a missing field and an unknown
	// id both mean "the host did not mention this water body", which has to stay
	// playable instead of silently disappearing from the picker.
	for (const area of AREAS) {
		if (options.locations?.[area.id] === false) locations[area.id] = false
	}
	return {
		container: options.container,
		publicBase,
		assetBase: base,
		storagePrefix: options.storagePrefix ?? 'fishing-game',
		muted: options.muted ?? false,
		startScreen: options.startScreen ?? 'menu',
		onExit: options.onExit,
		onCatch: options.onCatch,
		onProgress: options.onProgress,
		onReady: options.onReady,
		progress: options.progress,
		locations
	}
}
