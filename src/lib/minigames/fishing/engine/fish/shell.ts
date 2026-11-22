import type { FishSpecies } from './species'

/**
 * The shell that carries a pearl.
 *
 * It is not part of `FISH`: it has no codex entry of its own and must not count
 * towards the 40 species or an area's tier shares. It is offered as a bite on
 * every water body by `CastFlowState.beginBite` and then fights like any other
 * catch, which is why it is still a `FishSpecies`.
 *
 * `area` is metadata only (the shell can be hooked anywhere); it is never used
 * by `fishInArea`, because `FISH` does not contain this record.
 */
export const SHELL_SPECIES: FishSpecies = {
	id: 'shell',
	name: 'Ракушка',
	// The shell is heavy and slow: the fight is a stubborn pull, not a run.
	weightKg: [3, 7],
	speed: 0.22,
	resistance: 0.36,
	tint: 0xe8d8b4,
	tier: 'mythic',
	area: 'cove',
	behavior: 'shell'
}

export const SHELL_ID = SHELL_SPECIES.id

/** True for the shell catch, which is presented as a pearl, not a fish. */
export function isShell(id: string): boolean {
	return id === SHELL_ID
}
