import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { historyGameToCommonGame, playerMoveToCommonGame } from '$lib/utils'
import type { ReactiveGetter } from '$lib/types'

type MatchParams = {
	exclude_ids_history?: number[]
	exclude_ids_moves?: number[]
	igdb_ids: number[]
	exclude_player?: string
}

type Props = {
	/** ReactiveGetter — must be called inside $derived/$effect/createQuery */
	getPlayersSlugs: ReactiveGetter<string[]>
}

export class GamesMatchesStore {
	getPlayersSlugs: ReactiveGetter<string[]> = () => []

	constructor(params: Props) {
		this.getPlayersSlugs = params.getPlayersSlugs
	}

	gamesMatchParams = $state<MatchParams>({
		igdb_ids: [],
		exclude_player: undefined
	})

	historyMatchQuery = createQuery(() => {
		const playersFilter = this.gamesMatchParams.exclude_player
			? this.getPlayersSlugs().filter((p) => p !== this.gamesMatchParams.exclude_player)
			: this.getPlayersSlugs()
		const params = getGamesApiGamesHistoryGetOptions({
			baseUrl: EventlabBaseUrl,
			query: {
				igdb_ids: this.gamesMatchParams.igdb_ids,
				exclude_ids: this.gamesMatchParams.exclude_ids_history || [],
				start_id: null,
				players: playersFilter
				// events: ['aukus1', 'aukus2', 'aukus3']
			}
			// tags: ['abc']
		})
		// console.log('query params', params)
		params.enabled = this.gamesMatchParams.igdb_ids.length > 0
		params.refetchOnWindowFocus = false
		// params.queryKey.push({ _id: 'tag', tags: [playerSlug ?? 'all-players'] })
		return params
	})

	movesMatchQuery = createQuery(() => {
		const playersFilter = this.gamesMatchParams.exclude_player
			? this.getPlayersSlugs().filter((p) => p !== this.gamesMatchParams.exclude_player)
			: this.getPlayersSlugs()

		const params = getPlayerMovesApiPlayersMovesGetOptions({
			baseUrl: AukusBaseUrl,
			query: {
				igdb_ids: this.gamesMatchParams.igdb_ids,
				exclude_ids: this.gamesMatchParams.exclude_ids_moves || [],
				start_ts: null,
				players: playersFilter
			}
		})
		params.enabled = this.gamesMatchParams.igdb_ids.length > 0 && playersFilter.length > 0
		params.refetchOnWindowFocus = false
		return params
	})

	gamesMatched = $derived.by(() => {
		if (
			this.historyMatchQuery.isLoading ||
			this.historyMatchQuery.isFetching ||
			this.movesMatchQuery.isLoading ||
			this.movesMatchQuery.isFetching
		) {
			return []
		}
		const historyGames = (this.historyMatchQuery.data?.games || []).map(historyGameToCommonGame)
		const movesGames = (this.movesMatchQuery.data?.moves || []).map(playerMoveToCommonGame)
		return [...historyGames, ...movesGames]
	})
}
