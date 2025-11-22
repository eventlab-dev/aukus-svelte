import { AukusBaseUrl } from '$lib/client'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { GetPlayerMovesApiPlayersMovesGetData } from '$lib/heyapi/aukus/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

type QueryParams = GetPlayerMovesApiPlayersMovesGetData['query']

export function createPlayerMovesStore() {
	const queryParams = writable<QueryParams>({
		players: [],
		start_ts: null,
		search_title: null
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

	const playerMoves = derived([movesQuery], ([$movesQuery]) => {
		if ($movesQuery.isLoading || $movesQuery.isFetching) {
			return []
		}
		return $movesQuery.data?.moves ?? []
	})

	return {
		queryParams,
		movesQuery,
		playerMoves
	}
}
