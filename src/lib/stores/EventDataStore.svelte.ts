import { type TurnState } from '$lib/types'
import { createQuery } from '@tanstack/svelte-query'
import { derived, type Readable } from 'svelte/store'
import { getEventDataApiEventDataGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { SkinItem } from '$lib/heyapi/aukus/types.gen'
import { SvelteMap } from 'svelte/reactivity'
import { AukusBaseUrl } from '$lib/client'

export function createEventDataStore() {
	const eventDataQuery = createQuery({
		...{
			...getEventDataApiEventDataGetOptions(),
			baseUrl: AukusBaseUrl,
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
	const diceOptions = derived(eventData, ($eventData) => $eventData?.dice_options ?? [])

	const turnState: Readable<TurnState> = derived(myLastMove, ($myLastMove) => {
		if ($myLastMove && !$myLastMove.dice_roll_id) {
			return 'rolling-dice'
		}
		return 'filling-form'
	})

	const skinsById = derived(skins, ($skins) => {
		const map = new SvelteMap<number, SkinItem>()
		$skins.forEach((skin) => {
			map.set(skin.id, skin)
		})
		return map
	})

	return {
		eventDataQuery,
		players,
		skins,
		skinsById,
		achievements,
		eventSettings,
		turnState,
		myLastMove,
		diceOptions
	}
}
