import { EventlabBaseUrl } from '$lib/client'
import { getGamesApiGamesHistoryGetOptions } from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import type {
	GameHistoryItem,
	GetGamesApiGamesHistoryGetData
} from '$lib/heyapi/eventlab/types.gen'
import { createQuery } from '@tanstack/svelte-query'
import type { PlayerData } from '$lib/types'
import { SvelteMap } from 'svelte/reactivity'

type QueryParams = NonNullable<GetGamesApiGamesHistoryGetData['query']>

type Props = {
	getPlayers: () => PlayerData[]
}

export class GameHistoryStore {
	allLoadedGames = $state<GameHistoryItem[]>([])

	getPlayers: Props['getPlayers'] = () => []

	constructor(props: Props) {
		this.getPlayers = props.getPlayers

		$effect(() => {
			const games = this.historyQuery.data?.games
			if (games) {
				if (this.resetLoadedGames) {
					this.allLoadedGames = games
					this.resetLoadedGames = false
				} else {
					const newGames = games.filter(
						(newGame) => !this.allLoadedGames.some((existingGame) => existingGame.id === newGame.id)
					)
					this.allLoadedGames = [...this.allLoadedGames, ...newGames]
				}
			}
		})

		let previousSearchParams: QueryParams | null = null
		$effect(() => {
			if (previousSearchParams && this.searchParams) {
				const hasChanged =
					JSON.stringify(previousSearchParams.events) !== JSON.stringify(this.searchParams.events) ||
					JSON.stringify(previousSearchParams.players) !== JSON.stringify(this.searchParams.players) ||
					previousSearchParams.title_search !== this.searchParams.title_search

				if (hasChanged) {
					this.resetLoadedGames = true
					this.searchIdFrom = null
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
	fullPlayersList = $derived.by(() => this.getPlayers().map((p) => p.slug))

	searchParams = $state<QueryParams>({
		events: [],
		players: [],
		title_search: null
	})

	resetLoadedGames = $state(false)

	historyQuery = createQuery(() => {
		let playersFilter = this.fullPlayersList
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

	gamesHistoryByEvent = $derived(
		this.allLoadedGames.reduce((acc, game) => {
			if (!acc.has(game.event_name)) {
				acc.set(game.event_name, [])
			}
			acc.get(game.event_name)!.push(game)
			return acc
		}, new SvelteMap<string, GameHistoryItem[]>())
	)

	hasMore = $derived(Boolean(this.historyQuery.data?.next_id))
	loadMore() {
		const nextId = this.historyQuery.data?.next_id
		if (nextId) {
			this.searchIdFrom = nextId
		}
	}
}
