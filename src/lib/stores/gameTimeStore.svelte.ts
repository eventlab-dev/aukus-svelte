import { EventlabBaseUrl } from '$lib/client'
import {
	getGameDurationApiStreamsGameDurationGetOptions,
	searchGamesApiHltbSearchGetOptions
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'

const MIN_TITLE_LEN = 3

type Props = {
	getMyUserSlug: () => string | null
}

export class GameTimeStore {
	getMyUserSlug: Props['getMyUserSlug'] = () => null
	constructor(props: Props) {
		this.getMyUserSlug = props.getMyUserSlug
	}

	gameTitle = $state('')

	hltbQuery = createQuery(() => {
		const params = searchGamesApiHltbSearchGetOptions({
			baseUrl: EventlabBaseUrl,
			query: {
				search: this.gameTitle,
				exact: 1,
				limit: 1
			}
		})
		params.enabled = this.gameTitle.length >= MIN_TITLE_LEN
		return params
	})

	hltbMatch = $derived(this.hltbQuery.data?.games?.[0] ?? null)

	categoryDurationQuery = createQuery(() => {
		const params = getGameDurationApiStreamsGameDurationGetOptions({
			baseUrl: EventlabBaseUrl,
			query: {
				slug: this.getMyUserSlug() || '',
				game_name: this.gameTitle
			}
		})
		params.enabled = Boolean(this.gameTitle.length >= MIN_TITLE_LEN && this.getMyUserSlug())
		params.staleTime = 0
		// params.gcTime = 0
		return params
	})

	categoryDuration = $derived(this.categoryDurationQuery.data?.duration ?? 36000)

	hltbLink = $derived.by(() => {
		if (this.hltbMatch) {
			return `https://howlongtobeat.com/game/${this.hltbMatch.game_id}`
		}
		const cleanGameTitle = this.gameTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim()
		return cleanGameTitle
			? `https://howlongtobeat.com/?q=${encodeURIComponent(cleanGameTitle)}`
			: 'https://howlongtobeat.com/'
	})
}
