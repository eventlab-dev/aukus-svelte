import { AukusBaseUrl } from '$lib/client'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { GetPlayerMovesApiPlayersMovesGetData } from '$lib/heyapi/aukus/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

type QueryParams = GetPlayerMovesApiPlayersMovesGetData['query']

export function createPlayerMovesStore() {
	const queryParams = writable<QueryParams>({
		player_slug: null,
		start_ts: null,
		search: null
	})

	const movesQuery = createQuery(
		derived(queryParams, ($queryParams) => {
			return {
				...getPlayerMovesApiPlayersMovesGetOptions({
					baseUrl: AukusBaseUrl,
					query: $queryParams
				})
			}
		})
	)

	const playerMoves = derived(movesQuery, ($movesQuery) => $movesQuery.data?.moves ?? [])
	const otherPlayersMoves = derived(
		movesQuery,
		($movesQuery) => $movesQuery.data?.other_players ?? []
	)

	return {
		queryParams,
		movesQuery,
		playerMoves,
		otherPlayersMoves
	}
}
