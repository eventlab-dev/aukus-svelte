import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type {
	EventName,
	GameHistoryItem,
	GetGamesApiGamesHistoryGetData
} from '$lib/heyapi/eventlab/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, get, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'

type QueryParams = GetGamesApiGamesHistoryGetData['query']

export function createGamesHistoryStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const searchIdFrom = writable<number | null>(null)

	const fullPlayersList = derived(eventDataStore.players, ($players) => $players.map((p) => p.slug))

	const searchParams = writable<QueryParams>({
		events: [],
		players: [],
		title_search: null
	})

	const resetLoadedGames = writable(false)

	const historyQuery = createQuery(
		derived(
			[searchParams, searchIdFrom, fullPlayersList],
			([$search, $searchIdFrom, $fullPlayersList]) => {
				let playersFilter = $fullPlayersList
				if ($search?.players && $search.players.length > 0) {
					playersFilter = $search.players
				}
				const params = getGamesApiGamesHistoryGetOptions({
					baseUrl: EventlabBaseUrl,
					query: { ...$search, start_id: $searchIdFrom, players: playersFilter }
				})
				// params.placeholderData = (data) => data
				params.enabled = playersFilter.length > 0
				params.refetchOnWindowFocus = false
				return params
			}
		)
	)

	const allLoadedGames = writable<GameHistoryItem[]>([])

	historyQuery.subscribe(($historyQuery) => {
		if ($historyQuery.data?.games) {
			allLoadedGames.update((current) => {
				if (get(resetLoadedGames)) {
					resetLoadedGames.set(false)
					return $historyQuery.data.games
				}
				const newGames = $historyQuery.data.games.filter(
					(newGame) => !current.some((existingGame) => existingGame.id === newGame.id)
				)
				return [...current, ...newGames]
			})
		}
	})

	let previousSearchParams: QueryParams | null = null
	searchParams.subscribe((current) => {
		if (previousSearchParams !== null) {
			const hasChanged =
				JSON.stringify(previousSearchParams.events) !== JSON.stringify(current.events) ||
				JSON.stringify(previousSearchParams.players) !== JSON.stringify(current.players) ||
				previousSearchParams.title_search !== current.title_search

			if (hasChanged) {
				resetLoadedGames.set(true)
				searchIdFrom.set(null)
			}
		}
		previousSearchParams = { ...current }
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
