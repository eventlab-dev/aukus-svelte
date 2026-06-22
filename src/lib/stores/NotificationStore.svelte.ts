import type { AchievementItem, UnlockedAchievementItem } from '$lib/heyapi/aukus/types.gen'
import { SvelteMap } from 'svelte/reactivity'

type PersonalAchievement = AchievementItem & { is_first: boolean }

type Params = {
	getAchievementsById: () => SvelteMap<number, AchievementItem>
}

export class NotificationStore {
	constructor(params: Params) {
		this.getAchievementsById = params.getAchievementsById
	}

	getAchievementsById: () => SvelteMap<number, AchievementItem>

	unlockedAchievements = $state<UnlockedAchievementItem[]>([])
	achievements = $derived(
		this.unlockedAchievements
			.map((a) => {
				const achievement = this.getAchievementsById().get(a.id)
				if (!achievement) {
					return null
				}
				return { ...achievement, is_first: a.is_first }
			})
			.filter((a) => !!a) as PersonalAchievement[]
	)

	notify(items: UnlockedAchievementItem[]) {
		this.unlockedAchievements = items
	}

	hideNotification(id: number) {
		this.unlockedAchievements = this.unlockedAchievements.filter((i) => i.id !== id)
	}
}
