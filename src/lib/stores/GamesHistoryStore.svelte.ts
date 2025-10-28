import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type { EventName, GameHistoryItem } from '$lib/heyapi/eventlab/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

type SearchParams = {
	title_search: string | null
	events: EventName[]
	player_name: string | null
}

export function createGamesHistoryStore() {
	const searchParams = writable<SearchParams>({
		events: [],
		player_name: null,
		title_search: null
	})

	const historyQuery = createQuery(
		derived(searchParams, ($search) => {
			const params = getGamesApiGamesHistoryGetOptions({
				baseUrl: EventlabBaseUrl,
				query: { ...$search }
			})
			params['placeholderData'] = (data) => data
			return params
		})
	)

	const gamesHistory = derived(historyQuery, ($historyQuery) => $historyQuery.data?.games || [])

	const gamesHistoryByEvent = derived(gamesHistory, ($gamesHistory) => {
		const byEvent: Record<EventName, GameHistoryItem[]> = {} as Record<
			EventName,
			typeof $gamesHistory
		>
		$gamesHistory.forEach((game) => {
			const event = game.event_name
			if (!byEvent[event]) {
				byEvent[event] = []
			}

			byEvent[event].push(game)
		})
		return byEvent
	})

	return {
		searchParams,
		historyQuery,
		gamesHistory,
		gamesHistoryByEvent
	}
}
