import { createQuery } from '@tanstack/svelte-query'
import { derived, writable } from 'svelte/store'
import { getEventDataApiEventDataGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { type PlayerItem, type SkinItem } from '$lib/heyapi/aukus/types.gen'
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

	const players = writable<PlayerItem[]>([])
	const updatedPlayers = derived(eventData, ($eventData) => $eventData?.players ?? [])

	// const players = derived(eventData, ($eventData) => $eventData?.players ?? [])

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

	const achievementsById = derived(achievements, ($achievements) => {
		const map = new SvelteMap<number, (typeof $achievements)[0]>()
		$achievements.forEach((achievement) => {
			map.set(achievement.id, achievement)
		})
		return map
	})

	const achievementsWithScores = derived(achievements, ($achievements) => {
		return $achievements.filter((a) => a.points > 0)
	})

	const chatMessages = derived(eventData, ($eventData) => $eventData?.chat_messages ?? [])

	return {
		eventDataQuery,
		players,
		playersBySlug,
		updatedPlayers,
		skins,
		skinsById,
		achievements,
		achievementsById,
		eventSettings,
		diceOptions,
		chatMessages,
		achievementsWithScores
	}
}

export type EventDataStore = ReturnType<typeof createEventDataStore>
