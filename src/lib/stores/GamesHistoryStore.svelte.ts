import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type {
	EventName,
	GameHistoryItem,
	GetGamesApiGamesHistoryGetData
} from '$lib/heyapi/eventlab/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, get, writable } from 'svelte/store'

type QueryParams = GetGamesApiGamesHistoryGetData['query']

export function createGamesHistoryStore() {
	const searchIdFrom = writable<number | null>(null)

	const searchParams = writable<QueryParams>({
		events: [],
		player_name: null,
		title_search: null
	})

	const historyQuery = createQuery(
		derived([searchParams, searchIdFrom], ([$search, $searchIdFrom]) => {
			const params = getGamesApiGamesHistoryGetOptions({
				baseUrl: EventlabBaseUrl,
				query: { ...$search, start_id: $searchIdFrom }
			})
			params['placeholderData'] = (data) => data
			return params
		})
	)

	const allLoadedGames = writable<GameHistoryItem[]>([])
	historyQuery.subscribe(($historyQuery) => {
		if ($historyQuery.data?.games) {
			allLoadedGames.update((current) => {
				const newGames = $historyQuery.data!.games.filter(
					(newGame) => !current.some((existingGame) => existingGame.id === newGame.id)
				)
				return [...current, ...newGames]
			})
		}
	})

	searchParams.subscribe(() => {
		allLoadedGames.set([])
		searchIdFrom.set(null)
	})

	const gamesHistoryByEvent = derived(allLoadedGames, ($allLoadedGames) => {
		const byEvent: Record<EventName, GameHistoryItem[]> = {} as Record<
			EventName,
			typeof $allLoadedGames
		>
		$allLoadedGames.forEach((game) => {
			const event = game.event_name
			if (!byEvent[event]) {
				byEvent[event] = []
			}

			byEvent[event].push(game)
		})
		return byEvent
	})

	const hasMore = derived(historyQuery, ($historyQuery) => {
		return Boolean($historyQuery.data?.next_id)
	})

	function loadMore() {
		const nextId = get(historyQuery).data?.next_id
		if (nextId) {
			searchIdFrom.set(nextId)
		}
	}

	return {
		searchParams,
		historyQuery,
		gamesHistoryByEvent,
		hasMore,
		loadMore
	}
}
