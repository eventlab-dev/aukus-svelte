import { EventlabBaseUrl } from '$lib/client'
import {
	getGameDurationApiStreamsGameDurationGetOptions,
	searchGamesApiHltbSearchGetOptions
} from '$lib/heyapi/eventlab/@tanstack/svelte-query.gen'
import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'
import type { UsersStore } from './UsersStore.svelte'

const MIN_TITLE_LEN = 3

export function createGameTimeStore({ usersStore }: { usersStore: UsersStore }) {
	const gameTitle = writable('')

	const hltbQuery = createQuery(
		derived(gameTitle, ($searchTitle) => {
			const params = searchGamesApiHltbSearchGetOptions({
				baseUrl: EventlabBaseUrl,
				query: {
					search: $searchTitle,
					exact: 1,
					limit: 1
				}
			})
			params.enabled = $searchTitle.length >= MIN_TITLE_LEN
			console.log('search title', $searchTitle, params)
			return params
		})
	)

	const hltbMatch = derived(hltbQuery, ($query) => $query.data?.games?.[0] ?? null)

	const categoryDurationQuery = createQuery(
		derived([usersStore.myUser, gameTitle], ([$myUser, $gameTitle]) => {
			const options = getGameDurationApiStreamsGameDurationGetOptions({
				baseUrl: EventlabBaseUrl,
				query: {
					slug: $myUser?.slug || '',
					game_name: $gameTitle
				}
			})
			options.enabled = Boolean($gameTitle.length >= MIN_TITLE_LEN && $myUser)
			options.staleTime = 0
			// options.gcTime = 0
			return options
		})
	)

	const categoryDuration = derived(
		categoryDurationQuery,
		($categoryDurationQuery) => $categoryDurationQuery.data?.duration ?? 36000
	)

	const hltbLink = derived([gameTitle, hltbMatch], ([$gameTitle, $hltbMatch]) => {
		if ($hltbMatch) {
			return `https://howlongtobeat.com/game/${$hltbMatch.game_id}`
		}
		const cleanGameTitle = $gameTitle.replace(/\s*\(\d{4}\)\s*$/, '').trim()
		return cleanGameTitle
			? `https://howlongtobeat.com/?q=${encodeURIComponent(cleanGameTitle)}`
			: 'https://howlongtobeat.com/'
	})

	return {
		gameTitle,
		hltbQuery,
		hltbMatch,
		categoryDurationQuery,
		categoryDuration,
		hltbLink
	}
}
