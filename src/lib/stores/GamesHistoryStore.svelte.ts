import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type { EventName } from '$lib/heyapi/eventlab/types.gen'
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

	return {
		searchParams,
		historyQuery,
		gamesHistory
	}
}
