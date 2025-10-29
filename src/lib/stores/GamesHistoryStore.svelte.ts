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
type MatchParams = {
	exclude_ids: number[]
	titles: string[]
}

export function createGamesHistoryStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const searchIdFrom = writable<number | null>(null)

	const fullPlayersList = derived(eventDataStore.players, ($players) => $players.map((p) => p.slug))

	const searchParams = writable<QueryParams>({
		events: [],
		players: [],
		title_search: null
	})

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
				return params
			}
		)
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

	const gamesMatchParams = writable<MatchParams>({
		exclude_ids: [],
		titles: []
	})
	const gamesMatchQuery = createQuery(
		derived([gamesMatchParams, fullPlayersList], ([$gamesMatchParams, $fullPlayersList]) => {
			const params = getGamesApiGamesHistoryGetOptions({
				baseUrl: EventlabBaseUrl,
				query: { ...$gamesMatchParams, start_id: null, players: $fullPlayersList }
			})
			params['enabled'] = $gamesMatchParams.titles.length > 0 && $fullPlayersList.length > 0
			return params
		})
	)

	const gamesMatched = derived(
		[gamesMatchQuery, allLoadedGames],
		([$gamesFilteredQuery, $allLoadedGames]) => {
			// merge two lists, avoiding duplicates
			const mergedGames: GameHistoryItem[] = [...$allLoadedGames]
			$gamesFilteredQuery.data?.games.forEach((game) => {
				if (!mergedGames.some((g) => g.id === game.id)) {
					mergedGames.push(game)
				}
			})
			return mergedGames
		}
	)

	return {
		searchParams,
		historyQuery,
		gamesHistoryByEvent,
		hasMore,
		loadMore,
		gamesMatchParams,
		gamesMatched
	}
}
