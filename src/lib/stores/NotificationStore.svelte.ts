import { derived, writable } from 'svelte/store'
import type { EventDataStore } from './EventDataStore.svelte'
import type { AchievementItem, UnlockedAchievementItem } from '$lib/heyapi/aukus/types.gen'

type PersonalAchievement = AchievementItem & { is_first: boolean }

export function createNotificationStore({ eventDataStore }: { eventDataStore: EventDataStore }) {
	const unlockedAchievements = writable<UnlockedAchievementItem[]>([])

	const { achievementsById } = eventDataStore

	const achievements = derived(
		[achievementsById, unlockedAchievements],
		([$achievementsById, $unlockedAchievements]) => {
			return $unlockedAchievements
				.map((a) => {
					const achievement = $achievementsById.get(a.id)
					if (!achievement) {
						return null
					}
					return { ...achievement, is_first: a.is_first }
				})
				.filter((a) => !!a) as PersonalAchievement[]
		}
	)

	function notify(items: UnlockedAchievementItem[]) {
		unlockedAchievements.set(items)
	}

	function hideNotification(id: number) {
		unlockedAchievements.update((ids) => ids.filter((i) => i.id !== id))
	}

	return {
		achievements,
		notify,
		hideNotification
	}
}
