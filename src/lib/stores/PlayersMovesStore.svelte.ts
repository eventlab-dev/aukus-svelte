import { AukusBaseUrl } from '$lib/client'
import { getPlayerMovesApiPlayersPlayerSlugMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

export function createPlayerMovesStore() {
	const playerSlug = writable('')

	const movesQuery = createQuery(
		derived(playerSlug, ($playerSlug) => {
			return getPlayerMovesApiPlayersPlayerSlugMovesGetOptions({
				baseUrl: AukusBaseUrl,
				path: { player_slug: $playerSlug }
			})
		})
	)

	const playerMoves = derived(movesQuery, ($movesQuery) => $movesQuery.data?.moves ?? [])

	return {
		playerSlug,
		movesQuery,
		moves: playerMoves
	}
}
