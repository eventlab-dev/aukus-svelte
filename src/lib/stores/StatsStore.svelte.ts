import { AukusBaseUrl } from '$lib/client'
import { DEFAULT_REFETCH } from '$lib/constants'
import { playerStatsApiPlayersStatsGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { SvelteMap } from 'svelte/reactivity'

export class StatsStore {
	statsQuery = createQuery(() => ({
		...playerStatsApiPlayersStatsGetOptions({
			baseUrl: AukusBaseUrl
		}),
		refetchInterval: DEFAULT_REFETCH,
		refetchOnWindowFocus: false,
	}))

	stats = $derived(this.statsQuery.data?.players || [])
	statsBySlug = $derived(new SvelteMap(this.stats.map((stat) => [stat.player_slug, stat])))
}
