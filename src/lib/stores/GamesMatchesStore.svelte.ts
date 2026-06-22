import { AukusBaseUrl, EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { getPlayerMovesApiPlayersMovesGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { playerMoveToCommonGame } from '$lib/utils'


type MatchParams = {
	exclude_ids_history: number[]
	exclude_ids_moves: number[]
	titles: string[]
	exclude_player?: string
}

const EXCLUDE_TITLES = new Set(['Just Chatting'])

type Props = {
	getPlayerSlug: () => string | undefined
	getPlayersSlugs: () => string[]
}

export class GamesMatchesStore {

	getPlayerSlug: Props['getPlayerSlug'] = () => undefined
	getPlayersSlugs: Props['getPlayersSlugs'] = () => []

	constructor(params: Props) {
		this.getPlayerSlug = params.getPlayerSlug
		this.getPlayersSlugs = params.getPlayersSlugs
	}

	gamesMatchParams = $state<MatchParams>({
		exclude_ids_history: [],
		exclude_ids_moves: [],
		titles: [],
		exclude_player: undefined
	})

	historyMatchQuery = createQuery(() => {
		const titles = this.gamesMatchParams.titles.filter((t) => !EXCLUDE_TITLES.has(t))
		const slugsList = this.getPlayersSlugs()
		const params = getGamesApiGamesHistoryGetOptions({
			baseUrl: EventlabBaseUrl,
			query: {
				titles,
				exclude_ids: this.gamesMatchParams.exclude_ids_history,
				start_id: null,
				players: slugsList.filter((p) => p !== this.gamesMatchParams.exclude_player)
				// events: ['aukus1', 'aukus2', 'aukus3']
			}
			// tags: ['abc']
		})
		// console.log('query params', params)
		params.enabled = titles.length > 0
		params.refetchOnWindowFocus = false
		// params.queryKey.push({ _id: 'tag', tags: [playerSlug ?? 'all-players'] })
		return params
	})

	movesMatchQuery = createQuery(() => {
		const playersFilter = this.gamesMatchParams.exclude_player
			? this.getPlayersSlugs().filter((p) => p !== this.gamesMatchParams.exclude_player)
			: this.getPlayersSlugs()

		const titles = this.gamesMatchParams.titles.filter((t) => !EXCLUDE_TITLES.has(t))

		const params = getPlayerMovesApiPlayersMovesGetOptions({
			baseUrl: AukusBaseUrl,
			query: {
				titles,
				exclude_ids: this.gamesMatchParams.exclude_ids_moves,
				start_ts: null,
				players: playersFilter
			}
		})
		params.enabled = titles.length > 0 && playersFilter.length > 0
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
		const historyGames = this.historyMatchQuery.data?.games || []
		const movesGames = (this.movesMatchQuery.data?.moves || []).map(playerMoveToCommonGame)
		return [...historyGames, ...movesGames]
	})
}
