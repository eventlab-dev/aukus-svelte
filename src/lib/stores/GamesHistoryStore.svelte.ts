import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'

export function createGamesHistoryStore() {
	const search = writable('')

	const historyQuery = createQuery(
		derived(search, ($search) => {
			return {
				...getGamesApiGamesHistoryGetOptions({
					baseUrl: EventlabBaseUrl,
					query: { title_search: $search }
				})
			}
		})
	)

	const gamesHistory = derived(historyQuery, ($historyQuery) => $historyQuery.data?.games || [])

	return {
		search,
		historyQuery,
		gamesHistory
	}
}
