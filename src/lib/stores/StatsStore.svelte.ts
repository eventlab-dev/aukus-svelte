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
			return $query.data?.players || []
		}
		return []
	})

	const statsBySlug = derived(stats, ($stats) => {
		const map: Record<string, (typeof $stats)[0]> = {}
		$stats.forEach((stat) => {
			map[stat.player_slug] = stat
		})
		return map
	})

	return {
		statsQuery,
		stats,
		statsBySlug
	}
}
