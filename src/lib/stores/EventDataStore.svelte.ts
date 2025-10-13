import { createQuery } from '@tanstack/svelte-query'
import { derived } from 'svelte/store'
import { getEventDataApiEventDataGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import type { SkinItem } from '$lib/heyapi/aukus/types.gen'
import { SvelteMap } from 'svelte/reactivity'
import { AukusBaseUrl } from '$lib/client'
import { defaultAuth } from '$lib/utils'

export function createEventDataStore() {
	const eventDataQuery = createQuery({
		...getEventDataApiEventDataGetOptions({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		}),
		refetchInterval: 2 * 60 * 1000
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
	const diceOptions = derived(eventData, ($eventData) => $eventData?.dice_options ?? [])

	const skinsById = derived(skins, ($skins) => {
		const map = new SvelteMap<number, SkinItem>()
		$skins.forEach((skin) => {
			map.set(skin.id, skin)
		})
		return map
	})

	const playersBySlug = derived(players, ($players) => {
		const map = new SvelteMap<string, (typeof $players)[0]>()
		$players.forEach((player) => {
			map.set(player.slug, player)
		})
		return map
	})

	return {
		eventDataQuery,
		players,
		playersBySlug,
		skins,
		skinsById,
		achievements,
		eventSettings,
		diceOptions
	}
}

export type EventDataStore = ReturnType<typeof createEventDataStore>
