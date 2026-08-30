import { EventlabBaseUrl } from '$lib/client'
import {
	getGamesApiGamesHistoryGetOptions,
	getGamesStatsEndpointApiGamesHistoryStatsGetOptions
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type { GetGamesApiGamesHistoryGetData } from '$lib/heyapi/eventlab/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import type { CommonGameItem, ReactiveGetter } from '$lib/types'
import { SvelteMap } from 'svelte/reactivity'
import { untrack } from 'svelte'
import { historyGameToCommonGame } from '$lib/utils'

type QueryParams = NonNullable<GetGamesApiGamesHistoryGetData['query']>

type Props = {
	/** ReactiveGetter — must be called inside $derived/$effect/createQuery */
	getPlayersSlugs: ReactiveGetter<string[]>
}

export class GameHistoryStore {
	allLoadedGames = $state<CommonGameItem[]>([])

	getPlayersSlugs: ReactiveGetter<string[]> = () => []

	constructor(props: Props) {
		this.getPlayersSlugs = props.getPlayersSlugs

		$effect(() => {
			const games = this.historyQuery.data?.games
			if (games) {
				if (this.resetLoadedGames) {
					this.allLoadedGames = games.map(historyGameToCommonGame)
					this.resetLoadedGames = false
				} else {
					const loadedGames = untrack(() => this.allLoadedGames)
					const commonGames = games.map(historyGameToCommonGame)
					const newGames = commonGames.filter(
						(newGame) => !loadedGames.some((existingGame) => existingGame.id === newGame.id)
					)
					this.allLoadedGames = [...loadedGames, ...newGames]
				}
			}
		})

		let previousSearchParams: QueryParams | null = null
		$effect(() => {
			if (previousSearchParams && this.searchParams) {
				const hasChanged =
					previousSearchParams.title_search !== this.searchParams.title_search ||
					JSON.stringify(previousSearchParams.events) !==
						JSON.stringify(this.searchParams.events) ||
					JSON.stringify(previousSearchParams.players) !== JSON.stringify(this.searchParams.players)

				if (hasChanged) {
					this.resetLoadedGames = true
					this.searchIdFrom = null
					// Force query refetch by invalidating
					this.historyQuery.refetch()
				}
			}
			if (this.searchParams) {
				previousSearchParams = { ...this.searchParams }
			} else {
				previousSearchParams = null
			}
		})
	}

	searchIdFrom = $state<number | null>(null)

	searchParams = $state<QueryParams>({
		events: [],
		players: [],
		title_search: null
	})

	resetLoadedGames = $state(false)

	historyQuery = createQuery(() => {
		let playersFilter = this.getPlayersSlugs()
		if (this.searchParams?.players && this.searchParams.players.length > 0) {
			playersFilter = this.searchParams.players
		}

		const params = getGamesApiGamesHistoryGetOptions({
			baseUrl: EventlabBaseUrl,
			query: { ...this.searchParams, start_id: this.searchIdFrom, players: playersFilter }
		})
		// params.placeholderData = (data) => data
		params.enabled = playersFilter.length > 0
		params.refetchOnWindowFocus = false
		return params
	})

	gamesHistoryByEvent = $derived.by(() => {
		// console.log('history items fetched')
		return this.allLoadedGames.reduce((acc, game) => {
			if (!acc.has(game.event_name)) {
				acc.set(game.event_name, [])
			}
			acc.get(game.event_name)!.push(game)
			return acc
		}, new SvelteMap<string, CommonGameItem[]>())
	})

	hasMore = $derived(Boolean(this.historyQuery.data?.next_id))

	loadMore() {
		const nextId = this.historyQuery.data?.next_id
		if (nextId) {
			this.searchIdFrom = nextId
		}
	}

	historyStatsQuery = createQuery(() => {
		const params = getGamesStatsEndpointApiGamesHistoryStatsGetOptions({
			baseUrl: EventlabBaseUrl
		})
		params.refetchOnWindowFocus = false
		return params
	})

	eventsByPlayer = $derived.by(() => {
		const events = ['aukus4', 'aukus3', 'aukus2', 'aukus1']
		if (!this.historyStatsQuery.data) {
			return new SvelteMap<string, string[]>()
		}
		return this.historyStatsQuery.data.players.reduce((acc, stats) => {
			acc.set(
				stats.player_nickname,
				events.filter((event) => Boolean(stats.events[event]))
			)
			return acc
		}, new SvelteMap<string, string[]>())
	})
}
