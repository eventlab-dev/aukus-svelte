import { AukusBaseUrl } from '$lib/client'
import { playerStatsApiPlayersStatsGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived } from 'svelte/store'

export function createStatsStore() {
	const statsQuery = createQuery({
		...playerStatsApiPlayersStatsGetOptions({
			baseUrl: AukusBaseUrl
		}),
		refetchInterval: 2 * 60 * 1000
	})

	const stats = derived(statsQuery, ($query) => {
		if ($query.isSuccess) {
			return $query.data
		}
		return null
	})

	return {
		statsQuery,
		stats
	}
}
