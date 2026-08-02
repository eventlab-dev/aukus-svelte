import { createQuery } from '@tanstack/svelte-query'
import { getEventDataApiEventDataGetOptions } from '$lib/heyapi/aukus/@tanstack/svelte-query.gen'
import { SvelteMap } from 'svelte/reactivity'
import { AukusBaseUrl } from '$lib/client'
import { defaultAuth } from '$lib/utils'
import type { PlayerItem } from '$lib/heyapi/aukus/types.gen'
import { DEFAULT_REFETCH } from '$lib/constants'

export class EventDataStore {
	eventDataQuery = createQuery(() => ({
		...getEventDataApiEventDataGetOptions({
			baseUrl: AukusBaseUrl,
			auth: defaultAuth
		}),
		refetchInterval: DEFAULT_REFETCH,
		refetchOnWindowFocus: false,
	}))

	eventData = $derived(this.eventDataQuery.data)
	playersRaw = $derived(this.eventData?.players ?? [])

	players = $state<PlayerItem[]>([])

	skins = $derived(this.eventData?.skins ?? [])
	achievements = $derived(this.eventData?.achievements ?? [])
	eventSettings = $derived(this.eventData?.event_settings ?? {})
	diceOptions = $derived(this.eventData?.dice_options ?? [])

	skinsById = $derived(new SvelteMap(this.skins.map((skin) => [skin.id, skin])))
	achievementsById = $derived(
		new SvelteMap(this.achievements.map((achievement) => [achievement.id, achievement]))
	)
	playersBySlug = $derived(new SvelteMap(this.playersRaw.map((player) => [player.slug, player])))
	achievementsWithScores = $derived(
		this.achievements.filter((achievement) => achievement.points > 0)
	)
	chatMessages = $derived(this.eventData?.chat_messages ?? [])
	achievementsRarity = $derived.by(() => {
		const rarityMap = new SvelteMap<number, number>()
		for (const achievement of this.achievements) {
			const unlockedPlayers = this.playersRaw.filter((player) =>
				player.unlocked_achievements.some((a) => a.id === achievement.id)
			)
			rarityMap.set(achievement.id, unlockedPlayers.length)
		}
		return rarityMap
	})
}
