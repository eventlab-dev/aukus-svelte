import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { playerMoveToCommonGame } from '$lib/utils'

type MatchParams = {
	exclude_ids_history: number[]
	exclude_ids_moves: number[]
	titles: string[]
}

export function createGamesMatchesStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const fullPlayersList = derived(eventDataStore.players, ($players) => $players.map((p) => p.slug))

	const gamesMatchParams = writable<MatchParams>({
		exclude_ids_history: [],
		exclude_ids_moves: [],
		titles: []
	})
	const historyMatchQuery = createQuery(
		derived([gamesMatchParams], ([$gamesMatchParams]) => {
			const params = getGamesApiGamesHistoryGetOptions({
				baseUrl: EventlabBaseUrl,
				query: {
					titles: $gamesMatchParams.titles,
					exclude_ids: $gamesMatchParams.exclude_ids_history,
					start_id: null
					// players: $fullPlayersList
					// events: ['aukus1', 'aukus2', 'aukus3']
				}
			})
			params.enabled = $gamesMatchParams.titles.length > 0
			params.refetchOnWindowFocus = false
			return params
		})
	)

	const movesMatchQuery = createQuery(
		derived([gamesMatchParams, fullPlayersList], ([$gamesMatchParams, $fullPlayersList]) => {
			const params = getPlayerMovesApiPlayersMovesGetOptions({
				baseUrl: AukusBaseUrl,
				query: {
					titles: $gamesMatchParams.titles,
					exclude_ids: $gamesMatchParams.exclude_ids_moves,
					start_ts: null,
					players: $fullPlayersList
				}
			})
			params.enabled = $gamesMatchParams.titles.length > 0 && $fullPlayersList.length > 0
			params.refetchOnWindowFocus = false
			return params
		})
	)

	const gamesMatched = derived(
		[historyMatchQuery, movesMatchQuery],
		([$historyMatchQuery, $movesMatchQuery]) => {
			// merge two lists
			if (
				$historyMatchQuery.isLoading ||
				$historyMatchQuery.isFetching ||
				$movesMatchQuery.isLoading ||
				$movesMatchQuery.isFetching
			) {
				return []
			}
			const historyGames = $historyMatchQuery.data?.games || []
			const movesGames = ($movesMatchQuery.data?.moves || []).map(playerMoveToCommonGame)
			return [...historyGames, ...movesGames]
		}
	)

	return {
		gamesMatchParams,
		historyMatchQuery,
		gamesMatched
	}
}
