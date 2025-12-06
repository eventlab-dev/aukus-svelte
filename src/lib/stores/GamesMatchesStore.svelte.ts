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
	exclude_player?: string
}

const EXCLUDE_TITLES = new Set(['Just Chatting'])

export function createGamesMatchesStore({
	eventDataStore,
	playerSlug
}: {
	eventDataStore: EventDataStore
	playerSlug?: string
}) {
	const fullPlayersList = derived(eventDataStore.players, ($players) => $players.map((p) => p.slug))

	const gamesMatchParams = writable<MatchParams>({
		exclude_ids_history: [],
		exclude_ids_moves: [],
		titles: [],
		exclude_player: playerSlug
	})

	const historyMatchQuery = createQuery(
		derived([gamesMatchParams, fullPlayersList], ([$gamesMatchParams, $fullPlayersList]) => {
			// console.log('query', $gamesMatchParams)
			const titles = $gamesMatchParams.titles.filter((t) => !EXCLUDE_TITLES.has(t))

			const params = getGamesApiGamesHistoryGetOptions({
				baseUrl: EventlabBaseUrl,
				query: {
					titles,
					exclude_ids: $gamesMatchParams.exclude_ids_history,
					start_id: null,
					players: $fullPlayersList.filter((p) => p !== $gamesMatchParams.exclude_player)
					// events: ['aukus1', 'aukus2', 'aukus3']
				}
				// tags: ['abc']
			})
			// console.log('query params', params)
			params.enabled = titles.length > 0
			params.refetchOnWindowFocus = false
			// params.queryKey.push({ _id: 'tag', tags: [playerSlug ?? 'all-players'] })
			return params
		})
	)

	const movesMatchQuery = createQuery(
		derived([gamesMatchParams, fullPlayersList], ([$gamesMatchParams, $fullPlayersList]) => {
			const playersFilter = $gamesMatchParams.exclude_player
				? $fullPlayersList.filter((p) => p !== $gamesMatchParams.exclude_player)
				: $fullPlayersList

			const titles = $gamesMatchParams.titles.filter((t) => !EXCLUDE_TITLES.has(t))

			const params = getPlayerMovesApiPlayersMovesGetOptions({
				baseUrl: AukusBaseUrl,
				query: {
					titles,
					exclude_ids: $gamesMatchParams.exclude_ids_moves,
					start_ts: null,
					players: playersFilter
				}
			})
			params.enabled = titles.length > 0 && playersFilter.length > 0
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
