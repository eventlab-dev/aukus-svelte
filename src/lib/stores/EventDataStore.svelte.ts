import { EventlabBaseUrl } from '$lib/client'
import { type TurnState } from '$lib/types'
import { createQuery } from '@tanstack/svelte-query'
import { derived, type Readable } from 'svelte/store'
import { getEventDataApiEventDataGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'

export function createEventDataStore() {
	const eventDataQuery = createQuery({
		...{
			...getEventDataApiEventDataGetOptions(),
			baseUrl: EventlabBaseUrl,
			auth: () => localStorage.getItem('auth_token') ?? undefined
		},
		retry: false
	})

	const eventData = derived(eventDataQuery, ($query) => {
		if ($query.isSuccess) {
			return $query.data
		}
		return null
	})

	const players = derived(eventData, ($eventData) => $eventData?.players ?? [])
	const skins = derived(eventData, ($eventData) => $eventData?.skins ?? [])
	const achievements = derived(eventData, ($eventData) => $eventData?.achievements ?? [])
	const eventSettings = derived(eventData, ($eventData) => $eventData?.event_settings ?? {})
	const myLastMove = derived(eventData, ($eventData) => $eventData?.my_last_move ?? null)

	const turnState: Readable<TurnState> = derived(myLastMove, ($myLastMove) => {
		if ($myLastMove && !$myLastMove.dice_roll_id) {
			return 'rolling-dice'
		}
		return 'filling-form'
	})

	return {
		eventDataQuery,
		players,
		skins,
		achievements,
		eventSettings,
		turnState
	}
}
